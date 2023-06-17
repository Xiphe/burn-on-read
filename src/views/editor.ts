import { buttonStyles, contentStyles, focusStyles } from './common';

export type Props = {};
export default function Editor() {
  return `
    <textarea
      id="editor"
      placeholder="# Write your message here\n\nyou can use **markdown**."
      autofocus
      class="${contentStyles} ${focusStyles} w-full min-h-[15rem] "
    ></textarea>
    <div class="flex justify-end mt-3">
    <button id="seal" class="${buttonStyles} ${focusStyles}">Seal this message</button>
    </div>
  `;
}
