// Software Licensing & Hardware Machine ID Binding Engine
// Exclusively designed for Rehmat Lawn Mowers Enterprise ERP

const MASTER_SALT = 'REHMAT_ERP_SECURE_HARDWARE_LOCK_2026_@9942!';
const MASTER_DEV_KEY = 'RLM-DEV-MASTER-9942-ROOT';

/**
 * Fast native SHA-256 hash using Web Crypto API
 */
async function hashString(str) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  } catch (e) {
    // Basic fallback hash if subtle crypto fails
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(32, '0');
  }
}

/**
 * Get unique hardware Machine GUID from Tauri (Windows Registry) or persistent fallback
 */
export async function getHardwareGuid() {
  if (typeof window !== 'undefined' && window.__TAURI_INTERNALS__ && typeof window.__TAURI_INTERNALS__.invoke === 'function') {
    try {
      const guid = await window.__TAURI_INTERNALS__.invoke('get_machine_guid');
      if (guid && guid !== 'GENERIC_DEVICE' && guid.length > 5) {
        return guid.trim();
      }
    } catch (e) {
      console.warn('Tauri get_machine_guid invoke failed, using persistent fallback:', e);
    }
  }

  // Persistent Browser/Fallback Machine GUID
  let localSeed = localStorage.getItem('rehmat_hw_machine_guid');
  if (!localSeed) {
    localSeed = 'seed-' + Math.random().toString(36).substring(2) + '-' + Date.now().toString(36);
    localStorage.setItem('rehmat_hw_machine_guid', localSeed);
  }
  return localSeed;
}

/**
 * Generate formatted, clean Machine ID: RLM-XXXX-XXXX-XXXX
 */
export async function getFormattedMachineId() {
  const rawGuid = await getHardwareGuid();
  const hash = await hashString('RLM_MACHINE_' + rawGuid);
  // Extract 12 characters into 3 blocks of 4
  const part1 = hash.substring(0, 4);
  const part2 = hash.substring(4, 8);
  const part3 = hash.substring(8, 12);
  return `RLM-${part1}-${part2}-${part3}`;
}

/**
 * Generate the expected valid License Key for a specific Machine ID
 */
export async function generateLicenseKey(machineId, customerName = '') {
  const cleanId = (machineId || '').trim().toUpperCase();
  const rawTarget = `${MASTER_SALT}::${cleanId}::${customerName.trim().toUpperCase()}`;
  const fullHash = await hashString(rawTarget);
  
  // Format into RLM-XXXX-XXXX-XXXX-XXXX
  const p1 = fullHash.substring(0, 4);
  const p2 = fullHash.substring(4, 8);
  const p3 = fullHash.substring(8, 12);
  const p4 = fullHash.substring(12, 16);
  return `RLM-${p1}-${p2}-${p3}-${p4}`;
}

/**
 * Verify whether an entered license key is valid for this specific machine
 */
export async function verifyLicenseKey(enteredKey, currentMachineId, customerName = '') {
  if (!enteredKey || !currentMachineId) return false;
  const cleanEntered = enteredKey.trim().toUpperCase();

  // Master Developer Emergency Bypass Key
  if (cleanEntered === MASTER_DEV_KEY) {
    return true;
  }

  const expectedKey = await generateLicenseKey(currentMachineId, '');
  if (cleanEntered === expectedKey) {
    return true;
  }

  // Also check if key was generated with customer name
  if (customerName) {
    const expectedWithName = await generateLicenseKey(currentMachineId, customerName);
    if (cleanEntered === expectedWithName) return true;
  }

  return false;
}

/**
 * Check if the current system is activated
 */
export async function checkLicenseStatus() {
  try {
    const saved = localStorage.getItem('rehmat_software_license_v1');
    if (!saved) return { isLicensed: false, machineId: await getFormattedMachineId() };

    const parsed = JSON.parse(saved);
    const currentMachineId = await getFormattedMachineId();

    if (parsed.machineId !== currentMachineId) {
      // Machine mismatch! Attempted to copy localStorage to a different PC!
      return {
        isLicensed: false,
        machineId: currentMachineId,
        error: 'Hardware Mismatch: License belongs to a different machine.'
      };
    }

    const isValid = await verifyLicenseKey(parsed.licenseKey, currentMachineId, parsed.customerName || '');
    if (!isValid) {
      return { isLicensed: false, machineId: currentMachineId, error: 'Invalid or forged license key.' };
    }

    return {
      isLicensed: true,
      machineId: currentMachineId,
      customerName: parsed.customerName || 'Rehmat Lawn Mowers Store',
      activatedAt: parsed.activatedAt,
      licenseKey: parsed.licenseKey
    };
  } catch (e) {
    return { isLicensed: false, machineId: await getFormattedMachineId() };
  }
}

/**
 * Save verified license data
 */
export function saveLicenseData(licenseObj) {
  localStorage.setItem('rehmat_software_license_v1', JSON.stringify(licenseObj));
}

/**
 * Revoke or remove license (for re-activation or machine transfer)
 */
export function revokeLicense() {
  localStorage.removeItem('rehmat_software_license_v1');
}
