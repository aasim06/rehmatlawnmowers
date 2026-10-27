/**
 * Standalone License Key Generator for Rehmat Lawn Mowers ERP
 * Usage:
 *   node scripts/generate-license.cjs RLM-98F2-A41B-7C0E
 *   node scripts/generate-license.cjs RLM-98F2-A41B-7C0E "Main Branch Counter 1"
 */

const crypto = require('crypto');

const MASTER_SALT = 'REHMAT_ERP_SECURE_HARDWARE_LOCK_2026_@9942!';

function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex').toUpperCase();
}

function generateLicense(machineId, customerName = '') {
  const cleanId = (machineId || '').trim().toUpperCase();
  const rawTarget = `${MASTER_SALT}::${cleanId}::${customerName.trim().toUpperCase()}`;
  const fullHash = hashString(rawTarget);
  
  const p1 = fullHash.substring(0, 4);
  const p2 = fullHash.substring(4, 8);
  const p3 = fullHash.substring(8, 12);
  const p4 = fullHash.substring(12, 16);
  return `RLM-${p1}-${p2}-${p3}-${p4}`;
}

const machineIdArg = process.argv[2];
const customerNameArg = process.argv[3] || '';

if (!machineIdArg) {
  console.log('\n============================================================');
  console.log('  REHMAT LAWN MOWERS ERP - LICENSE KEY GENERATOR');
  console.log('============================================================');
  console.log('Usage:');
  console.log('  node scripts/generate-license.cjs <MACHINE_ID> [CUSTOMER_NAME]');
  console.log('\nExample:');
  console.log('  node scripts/generate-license.cjs RLM-98F2-A41B-7C0E "Rehmat Store Counter"');
  console.log('============================================================\n');
  process.exit(1);
}

const key = generateLicense(machineIdArg, customerNameArg);

console.log('\n============================================================');
console.log('  REHMAT LAWN MOWERS ERP - LICENSE KEY GENERATED');
console.log('============================================================');
console.log(`  Client Machine ID : ${machineIdArg.toUpperCase()}`);
if (customerNameArg) {
  console.log(`  Customer / Store  : ${customerNameArg}`);
}
console.log(`  Activation Key    : \x1b[32m\x1b[1m${key}\x1b[0m`);
console.log('============================================================');
console.log('Send this exact Activation Key to your client for 1-device activation.');
console.log('It will NOT work on any other computer.\n');
