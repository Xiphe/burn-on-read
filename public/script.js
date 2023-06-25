/**
 * @typedef {{ ciphertext: Uint8Array, iv: Uint8Array }} CipherMessage
 */

async function main() {
  document.getElementById('seal')?.addEventListener('click', handleSealClick);
  document
    .getElementById('preview')
    ?.addEventListener('click', handlePreviewClick);

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
 */
function handlePreviewClick(ev) {
  ev.preventDefault();
  ev.stopPropagation();
  const $previewButton = ev.target;
  const $editor = document.getElementById('editor');
  const $previewContainer = document.getElementById('preview-container');

  if (
    !isButton($previewButton) ||
    !isTextArea($editor) ||
    !isHTMLElement($previewContainer)
  ) {
    throw new Error('Unexpected App state');
  }

  if ($editor.classList.contains('hidden')) {
    $previewContainer.classList.add('hidden');
    $editor.classList.remove('hidden');
    $editor.focus();
    $previewButton.innerText = 'Preview';
  } else {
    const message = $editor.value;

    const text = markdownToHtml(message);
    console.log(text);
    $previewContainer.innerHTML = text;
    $editor.classList.add('hidden');
    $previewContainer.classList.remove('hidden');
    $previewButton.innerText = 'Edit';
  }
}

/**
 * @param {MouseEvent} ev
 */
async function handleSealClick(ev) {
  ev.preventDefault();
  ev.stopPropagation();
  const $sealButton = ev.target;

  if (!isButton($sealButton)) {
    throw new Error('Invalid event target');
  }

  $sealButton.setAttribute('disabled', 'true');
  $sealButton.innerText = 'Sealing...';

  const $editor = document.getElementById('editor');

  if (!isTextArea($editor)) {
    throw new Error('No editor found');
  }

  $editor.setAttribute('readonly', 'true');

  const message = $editor.value;
  const sharableUrl = await handleEncryption(message);

  const $linkInput = document.createElement('input');
  $linkInput.setAttribute('readonly', 'true');
  const linkStyles =
    'block w-full rounded-lg bg-stone-100 text-stone-950 dark:bg-stone-800 dark:text-stone-50 px-5 py-6 shadow sm:px-6 outline-none focus-visible:ring-2 focus-visible:ring-gray-600 dark:focus-visible:ring-gray-200';
  $linkInput.setAttribute('class', linkStyles);
  $linkInput.value = sharableUrl;

  $sealButton.remove();
  document.getElementById('preview')?.remove();
  document.getElementById('preview-container')?.remove();
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
  const $message = document.getElementById('message');

  if (!isButton($readButton) || !isHTMLElement($message)) {
    throw new Error('Invalid event target');
  }

  $readButton.setAttribute('disabled', 'true');
  $readButton.innerText = 'Decrypting...';

  const decryptedMessage = await handleDecryption(message, keyId, checksum);

  $message.innerHTML = markdownToHtml(decryptedMessage);
  $readButton.remove();
  $message.classList.remove('hidden');
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

/**
 * Based on https://github.com/developit/snarkdown
 * MIT License (https://github.com/developit/snarkdown/blob/main/LICENSE)
 */
const TAGS = {
  '': ['<em>', '</em>'],
  _: ['<strong>', '</strong>'],
  '*': ['<strong>', '</strong>'],
  '~': ['<s>', '</s>'],
  '\n': ['<br />'],
  ' ': ['<br />'],
  '-': ['<hr />'],
};
/**
 * @param {string} str
 */
function toId(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
/**
 * Outdent a string based on the first indented line's leading whitespace
 * @param {string} str
 */
function outdent(str) {
  return str.replace(RegExp('^' + (str.match(/^(\t| )+/) || '')[0], 'gm'), '');
}
/**
 * Encode special attribute characters to HTML entities in a String.
 * @param {string} str
 */
function encodeAttr(str) {
  return (str + '')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
/**
 * Parse Markdown into an HTML String.
 * @param {string} md
 * @param {Record<string, string>=} prevLinks
 */
function markdownToHtml(md, prevLinks) {
  let tokenizer =
      /((?:^|\n+)(?:\n---+|\* \*(?: \*)+)\n)|(?:^``` *(\w*)\n([\s\S]*?)\n```$)|((?:(?:^|\n+)(?:\t|  {2,}).+)+\n*)|((?:(?:^|\n)([>*+-]|\d+\.)\s+.*)+)|(?:!\[([^\]]*?)\]\(([^)]+?)\))|(\[)|(\](?:\(([^)]+?)\))?)|(?:(?:^|\n+)([^\s].*)\n(-{3,}|={3,})(?:\n+|$))|(?:(?:^|\n+)(#{1,6})\s*(.+)(?:\n+|$))|(?:`([^`].*?)`)|(  \n\n*|\n{2,}|__|\*\*|[_*]|~~)/gm,
    context = [],
    out = '',
    links = prevLinks || {},
    last = 0,
    chunk,
    prev,
    token,
    inner,
    t;

  function tag(token) {
    let desc = TAGS[token[1] || ''];
    /** @type {any} */
    let end = context[context.length - 1] == token;
    if (!desc) return token;
    if (!desc[1]) return desc[0];
    if (end) context.pop();
    else context.push(token);
    return desc[end | 0];
  }

  function flush() {
    let str = '';
    while (context.length) str += tag(context[context.length - 1]);
    return str;
  }

  md = md
    // ADDED: disallow any html
    .replace(/</gm, '&lt;')
    .replace(/(.)>/gm, '$1&gt;')
    .replace(/"/gm, '&quot;')
    .replace(/'/gm, '&#039;')
    // END ADDED
    .replace(/^\[(.+?)\]:\s*(.+)$/gm, (s, name, url) => {
      links[name.toLowerCase()] = url;
      return '';
    })
    .replace(/^\n+|\n+$/g, '');

  while ((token = tokenizer.exec(md))) {
    prev = md.substring(last, token.index);
    last = tokenizer.lastIndex;
    chunk = token[0];
    if (prev.match(/[^\\](\\\\)*\\$/)) {
      // escaped
    }
    // Code/Indent blocks:
    else if ((t = token[3] || token[4])) {
      chunk =
        '<pre class="code ' +
        (token[4] ? 'poetry' : token[2].toLowerCase()) +
        '"><code' +
        (token[2] ? ` class="language-${token[2].toLowerCase()}"` : '') +
        '>' +
        outdent(encodeAttr(t).replace(/^\n+|\n+$/g, '')) +
        '</code></pre>';
    }
    // > Quotes, -* lists:
    else if ((t = token[6])) {
      if (t.match(/\./)) {
        token[5] = token[5].replace(/^\d+/gm, '');
      }
      inner = markdownToHtml(outdent(token[5].replace(/^\s*[>*+.-]/gm, '')));
      if (t == '>') t = 'blockquote';
      else {
        t = t.match(/\./) ? 'ol' : 'ul';
        inner = inner.replace(/^(.*)(\n|$)/gm, '<li>$1</li>');
      }
      chunk = '<' + t + '>' + inner + '</' + t + '>';
    }
    // Images:
    else if (token[8]) {
      chunk = `<a href="${encodeAttr(
        token[8],
      )}" target="_blank" rel="noreferrer">Image: ${encodeAttr(token[7])}</a>`;
    }
    // Links:
    else if (token[10]) {
      out = out.replace(
        '<a>',
        `<a href="${encodeAttr(
          token[11] || links[prev.toLowerCase()],
        )}" target="_blank" rel="noreferrer">`,
      );
      chunk = flush() + '</a>';
    } else if (token[9]) {
      chunk = '<a>';
    }
    // Headings:
    else if (token[12] || token[14]) {
      console.log(token[12] || token[15]);

      t = 'h' + (token[14] ? token[14].length : token[13] > '=' ? 1 : 2);
      chunk =
        '<' +
        t +
        ' id="' +
        toId(token[12] || token[15]) +
        '">' +
        markdownToHtml(token[12] || token[15], links) +
        '</' +
        t +
        '>';
    }
    // `code`:
    else if (token[16]) {
      chunk = '<code>' + encodeAttr(token[16]) + '</code>';
    }
    // Inline formatting: *em*, **strong** & friends
    else if (token[17] || token[1]) {
      chunk = tag(token[17] || '--');
    }
    out += prev;
    out += chunk;
  }

  return (
    (out + md.substring(last) + flush())
      .replace(/^\n+|\n+$/g, '')
      // ADDED: remove escape characters
      .replace(/\\([0-9\*_~\[\]\-])/g, '$1')
      // END ADDED
      .replace(/\<\/ul\>\<br \/\>/g, '</ul>')
  );
}
