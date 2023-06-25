import {
  buttonStyles,
  contentStyles,
  focusStyles,
  proseStyles,
} from './common';

export type Props = {};
export default function Editor() {
  return `
    <textarea
      id="editor"
      placeholder="# Write your message here\n\nyou can use **markdown**."
      autofocus
      class="${contentStyles} ${focusStyles} w-full min-h-[15rem] "
    ></textarea>
    <div id="preview-container" class="hidden ${contentStyles} w-full min-h-[15rem] ${proseStyles}">
    </div>
    <div class="flex justify-end mt-3">
    <button id="preview" class="${buttonStyles} ${focusStyles} mr-4">Preview</button>
    <button id="seal" class="${buttonStyles} ${focusStyles}">Seal this message</button>
    </div>
  `;
}
