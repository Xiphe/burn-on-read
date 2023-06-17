async function main() {
  const $sealButton = document.getElementById('seal');
  if ($sealButton) {
    $sealButton.addEventListener('click', async () => {
      $sealButton.setAttribute('disabled', 'true');
      $sealButton.innerText = 'Sealing...';

      const $editor = document.getElementById('editor');

      if (!isTextArea($editor)) {
        throw new Error('No editor found');
      }

      const key = await generateKey();
      const message = $editor.value;
      const { encryptedMessage, iv } = await encryptMessage(key, message);
      const exportedKey = arrayToBase64(await exportKey(key));
      const serializedMessage = arrayToBase64(encryptedMessage);
      const serializedIv = arrayToBase64(iv);

      const url = new URL(window.location.href);
      url.pathname = '/read';
      url.hash = `#${serializedMessage}:${serializedIv}`;

      const finalUrl = url.toString();

      console.log(finalUrl);
    });
  }
}

/**
 *
 * @param {HTMLElement | null} element
 * @returns {element is HTMLTextAreaElement}
 */
function isTextArea(element) {
  return element?.tagName === 'TEXTAREA';
}

main();

async function generateKey() {
  // Generate a new AES-GCM key
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256, // can be 128, 192, or 256
    },
    true, // whether the key is extractable (i.e., can be used in exportKey)
    ['encrypt', 'decrypt'], // can be any combination of "encrypt" and "decrypt"
  );

  return key;
}

/**
 * @param {CryptoKey} key
 * @param {string} message
 */
async function encryptMessage(key, message) {
  const encoder = new TextEncoder();
  const encodedMessage = encoder.encode(message);

  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // must be 12 bytes

  const encryptedMessage = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedMessage,
  );

  return {
    encryptedMessage: new Uint8Array(encryptedMessage),
    iv,
  };
}

/**
 * @param {CryptoKey} key
 */
async function exportKey(key) {
  const exportedKeyBuffer = await window.crypto.subtle.exportKey('raw', key);
  const exportedKey = new Uint8Array(exportedKeyBuffer);
  return exportedKey;
}

/**
 * @param {Uint8Array} exportedKey
 */
async function importKey(exportedKey) {
  const key = await window.crypto.subtle.importKey(
    'raw',
    exportedKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt'],
  );
  return key;
}

/**
 * @param {Uint8Array} bytes
 */
function arrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * @param {string} base64
 */
function base64ToArray(base64) {
  const binary = window.atob(base64);
  const len = binary.length;
  let bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * @param {CryptoKey} key
 * @param {Uint8Array} encryptedMessage
 * @param {Uint8Array} iv
 */
async function decryptMessage(key, encryptedMessage, iv) {
  const decryptedMessageBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encryptedMessage,
  );

  const decoder = new TextDecoder();
  const decryptedMessage = decoder.decode(decryptedMessageBuffer);

  return decryptedMessage;
}
