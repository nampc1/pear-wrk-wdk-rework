const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SCHEMA_PATH = path.join(__dirname, '../schema.json');

// Define available modules for the wizard
const AVAILABLE_MODULES = [
  { key: 'evm', name: 'EVM (Standard)', package: '@tetherto/wdk-wallet-evm', defaultNetworks: ['ethereum'] },
  { key: 'evmErc4337', name: 'EVM (ERC-4337)', package: '@tetherto/wdk-wallet-evm-erc-4337', defaultNetworks: ['ethereum', 'polygon', 'arbitrum', 'plasma'] },
  { key: 'btc', name: 'Bitcoin', package: '@tetherto/wdk-wallet-btc', defaultNetworks: ['bitcoin'] },
  { key: 'solana', name: 'Solana', package: '@tetherto/wdk-wallet-solana', defaultNetworks: ['solana'] },
  { key: 'tron', name: 'Tron', package: '@tetherto/wdk-wallet-tron', defaultNetworks: ['tron'] },
  { key: 'ton', name: 'TON', package: '@tetherto/wdk-wallet-ton', defaultNetworks: ['ton'] },
  { key: 'spark', name: 'Spark', package: '@tetherto/wdk-wallet-spark', defaultNetworks: ['spark'] }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function runWizard() {
  console.log('\n🔮 WDK Worklet Configuration Wizard 🔮\n');
  
  const config = {
    walletModules: {},
    requiredNetworks: [],
    preloadModules: ['@buildonspark/spark-frost-bare-addon']
  };

  for (const mod of AVAILABLE_MODULES) {
    const answer = await question(`Enable ${mod.name}? (y/N): `);
    if (answer.toLowerCase().startsWith('y')) {
      const netAnswer = await question(`  Enter networks for ${mod.name} (default: ${mod.defaultNetworks.join(', ')}): `);
      const networks = netAnswer.trim() 
        ? netAnswer.split(',').map(s => s.trim()) 
        : mod.defaultNetworks;

      config.walletModules[mod.key] = {
        modulePath: mod.package,
        networks: networks
      };
      
      // Add to required networks (deduplicate)
      networks.forEach(n => {
        if (!config.requiredNetworks.includes(n)) config.requiredNetworks.push(n);
      });
      
      console.log(`  ✓ Enabled ${mod.name} on [${networks.join(', ')}]`);
    }
  }

  // Read existing schema to preserve other fields
  let existingSchema = {};
  if (fs.existsSync(SCHEMA_PATH)) {
    try {
      existingSchema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
    } catch (e) {}
  }

  const newSchema = {
    ...existingSchema,
    version: existingSchema.version || 1,
    config: config,
    schema: existingSchema.schema || [] // Preserve existing HRPC schema definitions
  };

  fs.writeFileSync(SCHEMA_PATH, JSON.stringify(newSchema, null, 2));
  console.log(`\n✨ Configuration saved to schema.json`);
  rl.close();
}

runWizard();