/**
 * Utility library for Client-Side Encryption (Zero-Knowledge)
 * Uses native Web Crypto API (AES-GCM 256-bit and PBKDF2)
 * Compatible with browsers and Node.js (for Jest testing)
 */

let webCrypto = null;
if (typeof window !== 'undefined' && window.crypto) {
  webCrypto = window.crypto;
} else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
  webCrypto = globalThis.crypto;
} else {
  try {
    // Hide node crypto module loading from Webpack compiler to avoid runtime crashes in the browser
    const nodeCrypto = eval('require')('crypto');
    webCrypto = nodeCrypto.webcrypto || nodeCrypto;
  } catch (e) {
    // Web Crypto is not supported or we are in a non-Node server context
  }
}

/**
 * Encodes a string as a Uint8Array
 */
const encoder = new TextEncoder();
/**
 * Decodes a Uint8Array as a string
 */
const decoder = new TextDecoder();

/**
 * Helper to convert ArrayBuffer/Uint8Array to Base64
 */
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof window !== 'undefined' && window.btoa) {
    return window.btoa(binary);
  } else {
    return Buffer.from(buffer).toString('base64');
  }
}

/**
 * Helper to convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  if (typeof window !== 'undefined' && window.atob) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } else {
    const buf = Buffer.from(base64, 'base64');
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
}

/**
 * Derives a CryptoKey (AES-GCM 256) from a passphrase and a salt (userId) using PBKDF2
 * @param {string} passphrase The secret passphrase entered by the user
 * @param {string} userId The Supabase UUID of the user (used as salt)
 * @param {boolean} extractable If the generated key is allowed to be exported (default: false for RAM safety)
 * @returns {Promise<CryptoKey>} The derived symmetric key
 */
export async function deriveKey(passphrase, userId, extractable = false) {
  if (!webCrypto || !webCrypto.subtle) {
    throw new Error('Web Crypto API subtle is not available');
  }

  const saltBuffer = encoder.encode(userId);
  const passphraseBuffer = encoder.encode(passphrase);

  // Import the raw passphrase as a key material
  const keyMaterial = await webCrypto.subtle.importKey(
    'raw',
    passphraseBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive the actual AES-GCM key
  return await webCrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    extractable, // extractability is configured dynamically
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts an object using AES-GCM with the derived key
 * @param {Object} dataObject The plain JavaScript object to encrypt
 * @param {CryptoKey} key The derived symmetric CryptoKey
 * @returns {Promise<string>} An encrypted Base64 string of format "IV.Ciphertext"
 */
export async function encryptData(dataObject, key) {
  if (!webCrypto || !webCrypto.subtle) {
    throw new Error('Web Crypto API subtle is not available');
  }

  const plaintext = JSON.stringify(dataObject);
  const plaintextBuffer = encoder.encode(plaintext);

  // Generate a random 12-byte Initialization Vector (IV)
  const iv = webCrypto.getRandomValues(new Uint8Array(12));

  // Encrypt using AES-GCM
  const ciphertextBuffer = await webCrypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    plaintextBuffer
  );

  // Convert IV and Ciphertext to Base64
  const ivBase64 = bufferToBase64(iv);
  const ciphertextBase64 = bufferToBase64(ciphertextBuffer);

  // Package as IV.Ciphertext
  return `${ivBase64}.${ciphertextBase64}`;
}

/**
 * Decrypts an encrypted string back into a JavaScript object
 * @param {string} encryptedString Base64 string of format "IV.Ciphertext"
 * @param {CryptoKey} key The derived symmetric CryptoKey
 * @returns {Promise<Object>} The decrypted JavaScript object
 */
export async function decryptData(encryptedString, key) {
  if (!webCrypto || !webCrypto.subtle) {
    throw new Error('Web Crypto API subtle is not available');
  }

  const parts = encryptedString.split('.');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivBase64, ciphertextBase64] = parts;
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
  const ciphertext = base64ToArrayBuffer(ciphertextBase64);

  // Decrypt using AES-GCM
  const decryptedBuffer = await webCrypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    ciphertext
  );

  const plaintext = decoder.decode(decryptedBuffer);
  return JSON.parse(plaintext);
}

// --- INDEXEDDB STORAGE FOR KEY (Zero-Knowledge hybrid persistency indexed by userId) ---

const DB_NAME = 'servitrack-crypto';
const STORE_NAME = 'keys';

/**
 * Saves the derived AES-GCM key in raw binary format to IndexedDB associated to a userId
 * @param {CryptoKey} key The CryptoKey object to save (must be extractable)
 * @param {string} userId The unique user ID
 * @returns {Promise<void>}
 */
export function saveKeyToIndexedDB(key, userId) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = async (e) => {
      const db = e.target.result;
      try {
        const rawKey = await webCrypto.subtle.exportKey('raw', key);
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(rawKey, userId);

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = (err) => {
          db.close();
          reject(err);
        };
      } catch (err) {
        db.close();
        reject(err);
      }
    };

    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Loads and imports the stored raw AES-GCM key from IndexedDB for a given userId
 * @param {string} userId The unique user ID
 * @returns {Promise<CryptoKey|null>} The CryptoKey (imported as non-extractable in RAM), or null if not found
 */
export function loadKeyFromIndexedDB(userId) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }

    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (e) => {
      const db = e.target.result;
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(userId);

      getRequest.onsuccess = async () => {
        const rawKey = getRequest.result;
        if (!rawKey) {
          db.close();
          return resolve(null);
        }

        try {
          // Import the raw AES key, making it non-extractable in memory for security
          const key = await webCrypto.subtle.importKey(
            'raw',
            rawKey,
            { name: 'AES-GCM', length: 256 },
            false, // key is non-extractable after import
            ['encrypt', 'decrypt']
          );
          db.close();
          resolve(key);
        } catch (err) {
          db.close();
          reject(err);
        }
      };

      getRequest.onerror = () => {
        db.close();
        reject(getRequest.error);
      };
    };

    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Deletes the stored raw AES key from IndexedDB for a given userId
 * @param {string} userId The unique user ID
 * @returns {Promise<void>}
 */
export function deleteKeyFromIndexedDB(userId) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve();
    }

    const request = window.indexedDB.open(DB_NAME, 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(userId);

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = (err) => {
        db.close();
        reject(err);
      };
    };

    request.onerror = (e) => reject(e.target.error);
  });
}
