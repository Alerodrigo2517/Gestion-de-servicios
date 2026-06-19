import { deriveKey, encryptData, decryptData } from '../src/lib/crypto';

describe('Servicios Criptográficos - Web Crypto API (Client-Side)', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockPassphrase = 'mi-frase-maestra-super-segura-123';
  const mockData = {
    name: 'Luz Edesur',
    amount: 15430.5,
    dueDate: '2026-06-15',
    consumptionUnit: 340,
    creditor: null,
    titular: 'Rodrigo A.',
  };

  test('deriveKey genera un CryptoKey de AES-GCM válido', async () => {
    const key = await deriveKey(mockPassphrase, mockUserId);
    expect(key).toBeDefined();
    expect(key.algorithm.name).toBe('AES-GCM');
    expect(key.usages).toContain('encrypt');
    expect(key.usages).toContain('decrypt');
    expect(key.extractable).toBe(false); // Inextractable por defecto en memoria
  });

  test('La derivación de claves es determinista (misma frase y usuario generan la misma clave)', async () => {
    const key1 = await deriveKey(mockPassphrase, mockUserId);
    const key2 = await deriveKey(mockPassphrase, mockUserId);
    
    // Para probar la equivalencia, encriptamos con key1 y desencriptamos con key2
    const encrypted = await encryptData(mockData, key1);
    const decrypted = await decryptData(encrypted, key2);
    
    expect(decrypted).toEqual(mockData);
  });

  test('Diferente frase genera clave diferente (falla la desencriptación)', async () => {
    const keyCorrect = await deriveKey(mockPassphrase, mockUserId);
    const keyIncorrect = await deriveKey('otra-frase-incorrecta', mockUserId);
    
    const encrypted = await encryptData(mockData, keyCorrect);
    
    // Intentar desencriptar con la clave incorrecta debe fallar (arroja error de AES-GCM)
    await expect(decryptData(encrypted, keyIncorrect)).rejects.toThrow();
  });

  test('Diferente usuario (sal) genera clave diferente (falla la desencriptación)', async () => {
    const keyCorrect = await deriveKey(mockPassphrase, mockUserId);
    const keyIncorrect = await deriveKey(mockPassphrase, 'otro-uuid-diferente');
    
    const encrypted = await encryptData(mockData, keyCorrect);
    
    await expect(decryptData(encrypted, keyIncorrect)).rejects.toThrow();
  });

  test('Encripta y desencripta objetos JSON con éxito conservando tipos de datos', async () => {
    const key = await deriveKey(mockPassphrase, mockUserId);
    const encrypted = await encryptData(mockData, key);
    
    expect(typeof encrypted).toBe('string');
    expect(encrypted.split('.').length).toBe(2); // Formato "IV.Ciphertext"
    
    const decrypted = await decryptData(encrypted, key);
    expect(decrypted).toEqual(mockData);
    expect(decrypted.amount).toBe(15430.5); // Conserva el tipo numérico
    expect(decrypted.name).toBe('Luz Edesur');
  });

  test('La clave derivada es exportable a raw y se puede volver a importar de forma inextractable (flujo IndexedDB)', async () => {
    const key = await deriveKey(mockPassphrase, mockUserId, true);
    expect(key.extractable).toBe(true);

    // Export key to raw format (ArrayBuffer)
    let webCrypto;
    if (typeof window !== 'undefined' && window.crypto) {
      webCrypto = window.crypto;
    } else {
      webCrypto = require('crypto').webcrypto || require('crypto');
    }
    
    const rawKey = await webCrypto.subtle.exportKey('raw', key);
    expect(rawKey.byteLength).toBe(32); // 256 bits = 32 bytes

    // Import the raw key back as non-extractable
    const importedKey = await webCrypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable
      ['encrypt', 'decrypt']
    );

    expect(importedKey.extractable).toBe(false);

    // Verify imported key can decrypt data encrypted with original key
    const encrypted = await encryptData(mockData, key);
    const decrypted = await decryptData(encrypted, importedKey);
    expect(decrypted).toEqual(mockData);
  });
});
