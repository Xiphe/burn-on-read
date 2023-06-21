/**
 * @typedef {{ ciphertext: Uint8Array, iv: Uint8Array }} CipherMessage
 */

/**
 * @type {typeof import('quill').Quill}
 */
const Quill = /** @type {any} */ (window).Quill;

const supportedQuillFormats = [
  'bold',
  'italic',
  'underline',
  'strike',
  'link',
  'code',
  'header',
  'list',
  'blockquote',
  'code-block',
  'align',
  'indent',
];

async function main() {
  if (document.getElementById('editor') !== null) {
    var quill = new Quill('#editor', {
      formats: supportedQuillFormats,
      modules: {
        toolbar: '#toolbar',
      },
      theme: 'snow',
    });

    quill.focus();

    document.getElementById('seal')?.addEventListener('click', (event) => {
      console.log(quill.getContents());
      handleSealClick(event, quill);
    });
  }

  const $readButton = document.getElementById('read');
  if (isButton($readButton)) {
    const message = deserializeMessageFromUrl();
    const keyId = $readButton.dataset.id;

    if (typeof keyId !== 'string') {
      throw new Error('Invalid keyId');
    }

    const checksum = await validateMessage(message, keyId);

    $readButton.addEventListener('click', (ev) => {
      handleDecryptionClick(ev, message, keyId, checksum);
    });
    $readButton.removeAttribute('disabled');
    $readButton.innerText = 'Read message';
  }
}

main();

/**
 * @param {CipherMessage} message
 * @param {string} keyId
 */
async function validateMessage(message, keyId) {
  const currentMessageChecksum = await generateChecksum(
    new Uint8Array([...message.ciphertext, ...message.iv]),
  );

  const res = await fetch('/api/key/' + keyId + '/' + currentMessageChecksum);
  if (!res.ok) {
    throw new Error('Invalid message');
  }
  const data = await res.json();
  if (
    !isRecord(data) ||
    data.status !== 'ok' ||
    typeof data.valid !== 'boolean'
  ) {
    throw new Error('Invalid response');
  }

  if (data.valid !== true) {
    throw new Error('Invalid message');
  }

  return currentMessageChecksum;
}

/**
 * @param {MouseEvent} ev
 * @param {import('quill').Quill} quill
 */
async function handleSealClick(ev, quill) {
  ev.preventDefault();
  ev.stopPropagation();
  const $sealButton = ev.target;
  const $editor = document.getElementById('editor');
  const $toolbar = document.getElementById('toolbar');

  if (
    !isButton($sealButton) ||
    !isHTMLElement($editor) ||
    !isHTMLElement($toolbar)
  ) {
    throw new Error('Invalid app state');
  }

  $sealButton.setAttribute('disabled', 'true');
  $sealButton.innerText = 'Sealing...';
  $editor.classList.remove('rounded-t-none');
  $toolbar.querySelectorAll('button').forEach(($button) => {
    $button.setAttribute('disabled', 'true');
  });

  quill.disable();

  const message = JSON.stringify(quill.getContents());
  const sharableUrl = await handleEncryption(message);

  const $linkInput = document.createElement('input');
  $linkInput.setAttribute('readonly', 'true');
  const linkStyles =
    'block w-full rounded-lg bg-stone-100 text-stone-950 dark:bg-stone-800 dark:text-stone-50 px-5 py-6 shadow sm:px-6 outline-none focus-visible:ring-2 focus-visible:ring-gray-600 dark:focus-visible:ring-gray-200';
  $linkInput.setAttribute('class', linkStyles);
  $linkInput.value = sharableUrl;

  $toolbar.remove();
  $sealButton.remove();

  $editor.replaceWith($linkInput);
  $linkInput.select();
}

/**
 * @param {MouseEvent} ev
 * @param {CipherMessage} message
 * @param {string} keyId
 * @param {string} checksum
 */
async function handleDecryptionClick(ev, message, keyId, checksum) {
  ev.preventDefault();
  ev.stopPropagation();
  const $readButton = ev.target;

  if (!isButton($readButton)) {
    throw new Error('Invalid event target');
  }
  const $contentContainer = $readButton.parentElement;
  if (!isHTMLElement($contentContainer)) {
    throw new Error('Invalid app state');
  }

  $readButton.setAttribute('disabled', 'true');
  $readButton.innerText = 'Decrypting...';

  const decryptedDelta = await handleDecryption(message, keyId, checksum);

  const $editor = document.createElement('div');
  const quill = new Quill($editor, {
    formats: supportedQuillFormats,
    modules: {
      toolbar: false,
    },
    theme: 'snow',
  });
  quill.setContents(JSON.parse(decryptedDelta));
  const content = quill.root.innerHTML;

  $contentContainer.innerHTML = content;
}

/**
 * @param {string} message
 */
async function handleEncryption(message) {
  const key = await generateKey();
  const { encryptedMessage, iv } = await encryptMessage(key, message);
  const exportedKey = arrayToBase64(await exportKey(key));
  const checksum = await generateChecksum(
    new Uint8Array([...encryptedMessage, ...iv]),
  );

  // TODO: Save key to database
  const res = await fetch('/api/key', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key: exportedKey, checksum }),
  });
  if (!res.ok) {
    throw new Error('Failed to store key');
  }

  /** @type {unknown} */
  const data = await res.json();

  if (!isRecord(data)) {
    throw new Error('Invalid response');
  }

  if (data.status !== 'ok' || typeof data.keyId !== 'string') {
    throw new Error('Invalid response');
  }

  const serializedMessage = arrayToBase64(encryptedMessage);
  const serializedIv = arrayToBase64(iv);

  const url = new URL(window.location.href);
  url.pathname = '/read/' + data.keyId;
  url.hash = `#${serializedMessage}:${serializedIv}`;

  const finalUrl = url.toString();

  return finalUrl;
}

/**
 * @returns {CipherMessage}
 */
function deserializeMessageFromUrl() {
  const [ciphertext, iv] = window.location.hash.replace(/^#/, '').split(':');

  if (typeof iv !== 'string') {
    throw new Error('Invalid message');
  }

  return {
    ciphertext: base64ToArray(ciphertext),
    iv: base64ToArray(iv),
  };
}

/**
 * @param {CipherMessage} message
 * @param {string} keyId
 * @param {string} checksum
 */
async function handleDecryption(message, keyId, checksum) {
  const res = await fetch('/api/key', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: keyId, checksum }),
  });

  if (!res.ok) {
    throw new Error('Failed to get key');
  }

  /** @type {unknown} */
  const data = await res.json();

  if (!isRecord(data) || data.status !== 'ok' || typeof data.key !== 'string') {
    throw new Error('Invalid response');
  }

  const importedKey = await importKey(base64ToArray(data.key));
  const decryptedMessage = await decryptMessage(
    importedKey,
    message.ciphertext,
    message.iv,
  );

  return decryptedMessage;
}

/**
 *
 * @param {HTMLElement | EventTarget | null} element
 * @returns {element is HTMLButtonElement}
 */
function isButton(element) {
  return isHTMLElement(element) && element.tagName === 'BUTTON';
}

/**
 *
 * @param {HTMLElement | EventTarget | null} element
 * @returns {element is HTMLTextAreaElement}
 */
function isTextArea(element) {
  return isHTMLElement(element) && element.tagName === 'TEXTAREA';
}

/**
 *
 * @param {HTMLElement | EventTarget | null} element
 * @returns {element is HTMLElement}
 */
function isHTMLElement(element) {
  return Boolean(element && 'tagName' in element);
}

/**
 * @param {unknown} obj
 * @returns {obj is Record<string, unknown>}
 */
function isRecord(obj) {
  return typeof obj === 'object' && obj !== null;
}

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
 * @param {Uint8Array} data
 */
async function generateChecksum(data) {
  // Generate a SHA-256 hash of the data
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);

  return toHexString(new Uint8Array(hashBuffer));
}

/**
 * @param {Uint8Array} data
 */
function toHexString(data) {
  return Array.from(data, (byte) => {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
}
