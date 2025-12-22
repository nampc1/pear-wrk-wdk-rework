import RPC from 'bare-rpc'
import { COMMANDS, MODULES } from './rpc-commands.mjs'
import { rpcException } from '../src/exceptions/rpc-exception.js' with { imports: 'bare-node-runtime/imports' }
import WDK from '@tetherto/wdk' with { imports: 'bare-node-runtime/imports' }
import WalletManagerEvmErc4337 from '@tetherto/wdk-wallet-evm-erc-4337' with { imports: 'bare-node-runtime/imports' }
import WalletManagerSpark from '@tetherto/wdk-wallet-spark' with { imports: 'bare-node-runtime/imports' }
import WalletManagerEvm from '@tetherto/wdk-wallet-evm' with { imports: 'bare-node-runtime/imports' }
import WalletManagerBtc from '@tetherto/wdk-wallet-btc' with { imports: 'bare-node-runtime/imports' }
import WalletManagerSolana from '@tetherto/wdk-wallet-solana' with { imports: 'bare-node-runtime/imports' }
import WalletManagerTron from '@tetherto/wdk-wallet-tron' with { imports: 'bare-node-runtime/imports' }
import WalletManagerTronGasfree from '@tetherto/wdk-wallet-tron-gasfree' with { imports: 'bare-node-runtime/imports' }
import WalletManagerTon from '@tetherto/wdk-wallet-ton' with { imports: 'bare-node-runtime/imports' }
import WalletManagerTonGasless from '@tetherto/wdk-wallet-ton-gasless' with { imports: 'bare-node-runtime/imports' }
import AaveProtocolEvm from '@tetherto/wdk-protocol-lending-aave-evm' with { imports: 'bare-node-runtime/imports' }

/**
 * @typedef {Object} WdkWorkletInit
 * @property {string} seedPhrase
 * @property {WdkModuleMetadata[]} items
 */

/**
 * @typedef {Object} WdkModuleMetadata
 * @property {'wallet' | 'protocol'} type
 * @property {string} name
 * @property {string} moduleName
 * @property {string} network
 * @property {Record<string, any>} config
 */

class WdkWorklet {
  constructor (registry) {
    this.registry = registry
    /** @type {WDK} */
    this.wdk = null
  }

  run () {
    // eslint-disable-next-line no-undef
    const { IPC } = BareKit
    // eslint-disable-next-line no-unused-vars
    const rpc = new RPC(IPC, async (req) => {
      try {
        if (req.command === COMMANDS.PING) {
          return req.reply('hello from the other side')
        }

        if (req.command === COMMANDS.START) {
          const result = await this.start(JSON.parse(req.data))
          return req.reply(JSON.stringify(result))
        }

        if (req.command === COMMANDS.GET_ADDRESS) {
          const result = await this.getAddress(JSON.parse(req.data))
          return req.reply(JSON.stringify(result))
        }

        if (req.command === COMMANDS.QUOTE_LENDING_SUPPLY) {
          const [protocolInfo, supplyOptions] = JSON.parse(req.data)
          const result = await this.quoteLendingSupply(protocolInfo, supplyOptions)
          return req.reply(JSON.stringify(result))
        }
      } catch (error) {
        req.reply(JSON.stringify(rpcException({ error })))
      }
    })
  }

  /**
   * @param {WdkWorkletInit} init
   */
  async start (init) {
    if (this.wdk) {
      console.log('Disposing existing WDK instance...')
      this.wdk.dispose()
    }

    console.log('Initializing WDK with seed phrase:', {
      seedPhraseType: typeof init.seedPhrase,
      seedPhraseLength: init.seedPhrase?.length,
      seedPhraseWordCount: init.seedPhrase?.split(' ').length
    })

    this.wdk = new WDK(init.seedPhrase)

    const items = init.items || []
    const registeredModules = []

    for (const item of items) {
      const Module = this.registry[item.moduleName]

      if (!Module) {
        throw new Error(`Module not found: ${item.moduleName}`)
      }

      console.log(`Registering ${item.name} wallet with config:`, {
        moduleName: item.moduleName,
        ...item.config
      })

      if (item.type === 'wallet') {
        this.wdk.registerWallet(item.network, Module, item.config)
      }

      if (item.type === 'protocol') {
        this.wdk.registerProtocol(item.network, item.name, Module, item.config)
      }

      registeredModules.push({
        type: item.type,
        network: item.network,
        name: item.name,
        moduleName: item.moduleName
      })
    }

    console.log('WDK initialization complete')
    return { status: 'started', modules: registeredModules }
  }

  /**
   * @param {string[]} chains - List of chains to get address
   */
  async getAddress (chains) {
    if (!this.wdk) {
      return { status: 'failed', data: {} }
    }

    const results = await Promise.allSettled(chains.map(async (chain) => {
      const account = await this.wdk.getAccount(chain) // need to handle index as well
      const address = await account.getAddress()
      return { chain, address }
    }))

    const data = {}
    for (const result of results) {
      if (result.status === 'fulfilled') {
        data[result.value.chain] = result.value.address
      } else {
        console.error(`Failed to get address for chain`, result.reason)
      }
    }

    return { status: 'ok', data }
  }

  /**
   * @param {Object} protocolInfo
   * @param {string} protocolInfo.chain
   * @param {string} protocolInfo.name - protocol name
   * @param {Object} supplyOptions
   * @param {string} supplyOptions.token
   * @param {number} supplyOptions.amount
   */
  async quoteLendingSupply ({ chain, name }, { token, amount }) {
    if (!this.wdk) {
      return { status: 'failed', data: {} }
    }

    const account = await this.wdk.getAccount(chain)
    const lendingProtocol = await account.getLendingProtocol(name)

    const supplyQuote = await lendingProtocol.quoteSupply({ token, amount })

    return { status: 'ok', data: supplyQuote }
  }
}

// --- Entry Point ---

const registry = {
  [MODULES.EVM_ERC_4337]: WalletManagerEvmErc4337,
  [MODULES.SPARK]: WalletManagerSpark,
  [MODULES.EVM]: WalletManagerEvm,
  [MODULES.BTC]: WalletManagerBtc,
  [MODULES.SOLANA]: WalletManagerSolana,
  [MODULES.TRON]: WalletManagerTron,
  [MODULES.TRON_GASFREE]: WalletManagerTronGasfree,
  [MODULES.TON]: WalletManagerTon,
  [MODULES.TON_GASLESS]: WalletManagerTonGasless,
  [MODULES.AAVE_EVM]: AaveProtocolEvm
}

const worklet = new WdkWorklet(registry)
worklet.run()