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

// eslint-disable-next-line no-undef
const { IPC } = BareKit
console.log('[WORKLET] 🟢 RPC Initialized')
const rpc = new RPC(IPC, async (req) => {
  console.log('[WORKLET] 📨 Request received:', req.command)
  try {
    if (req.command === COMMANDS.PING) {
      return req.reply(await ping())
    }

    if (req.command === COMMANDS.START) {
      const result = await start(JSON.parse(req.data))
      return req.reply(JSON.stringify(result))
    }

    if (req.command === COMMANDS.GET_ADDRESS) {
      const result = await getAddress(JSON.parse(req.data))
      return req.reply(JSON.stringify(result))
    }

    if (req.command === COMMANDS.QUOTE_LENDING_SUPPLY) {
      const [protocolInfo, supplyOptions] = JSON.parse(req.data)
      const result = await quoteLendingSupply(protocolInfo, supplyOptions)
      return req.reply(JSON.stringify(result))
    }
  } catch (error) {
    req.reply(JSON.stringify(rpcException({ error })))
  }
})

/** @type {WDK} */
let wdk = null

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

async function ping () {
  return 'hello from the other side'
}

/**
 * 
 * @param {WdkWorkletInit} init
 * @returns 
 */
async function start (init) {
  if (wdk) {
    console.log('Disposing existing WDK instance...')
    wdk.dispose()
  }

  console.log('Initializing WDK with seed phrase:', {
    seedPhraseType: typeof init.seedPhrase,
    seedPhraseLength: init.seedPhrase?.length,
    seedPhraseWordCount: init.seedPhrase?.split(' ').length,
    firstWord: init.seedPhrase?.split(' ')[0],
    lastWord: init.seedPhrase?.split(' ')[init.seedPhrase?.split(' ').length - 1]
  })

  wdk = new WDK(init.seedPhrase)

  const items = init.items || []
  const registeredModules = []

  for (const item of items) {
    const Module = registry[item.moduleName]

    if (!Module) {
      throw new Error(`Module not found: ${item.moduleName}`)
    }

    console.log(`Registering ${item.name} wallet with config:`, {
      moduleName: item.moduleName,
      ...item.config
    })

    if (item.type === 'wallet') {
      wdk.registerWallet(item.network, Module, item.config)
    }

    if (item.type === 'protocol') {
      wdk.registerProtocol(item.network, item.name, Module, item.config)
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
 * 
 * @param {string[]} chains - List of chains to get address
 * @returns 
 */
async function getAddress(chains) {
  if (!wdk) {
    return { status: 'failed', data: {} }
  }

  const entries = await Promise.all(chains.map(async (chain) => {
    const account = await wdk.getAccount(chain) // need to handle index as well
    const address = await account.getAddress()

    return [chain, address]
  }))

  return { status: 'ok', data: Object.fromEntries(entries) }
}

/**
 * 
 * @param {Object} protocolInfo
 * @param {string} protocolInfo.chain
 * @param {string} protocolInfo.name - protocol name
 * @param {Object} supplyOptions
 * @param {string} supplyOptions.token
 * @param {number} supplyOptions.amount
 * @returns 
 */
async function quoteLendingSupply({ chain, name }, { token, amount }) {
  if (!wdk) {
    return { status: 'failed', data: {} }
  }

  const account = await wdk.getAccount(chain)
  const lendingProtocol = await account.getLendingProtocol(name)

  const supplyQuote = await lendingProtocol.quoteSupply({ token, amount })

  return { status: 'ok', data: supplyQuote }
}