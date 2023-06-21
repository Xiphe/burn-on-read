import { buttonStyles, contentStyles, focusStyles } from './common';

export type Props = {};
export default function Editor() {
  return `
    <style>
    </style>
    <div id="toolbar" class="text-stone-300 dark:bg-stone-900 rounded-t-md">
      <span class="ql-formats">
        <button class="${focusStyles} rounded-sm ql-bold" title="Bold" aria-label="Bold"></button>
        <button class="${focusStyles} rounded-sm ql-italic" title="Italic" aria-label="Italic"></button>
        <button class="${focusStyles} rounded-sm ql-underline" title="Underline" aria-label="Underline"></button>
        <button class="${focusStyles} rounded-sm ql-strike" title="Strikethrough" aria-label="Strikethrough"></button>
      </span>
      <span class="ql-formats">
        <button class="${focusStyles} rounded-sm ql-link" title="Insert Link" aria-label="Insert Link"></button>
        <button class="${focusStyles} rounded-sm ql-code" title="Inline Code" aria-label="Inline Code"></button>
      </span>
      <span class="ql-formats">
       <button class="${focusStyles} rounded-sm ql-header" value="1" title="Headline" aria-label="Headline"></button>
       <button class="${focusStyles} rounded-sm ql-header" value="2" title="Sub-Headline" aria-label="Sub-Headline"></button>
      </span>
      <span class="ql-formats">
        <button class="${focusStyles} rounded-sm ql-list" value="ordered" title="Ordered List" aria-label="Ordered List"></button>
        <button class="${focusStyles} rounded-sm ql-list" value="bullet" title="Unordered List" aria-label="Unordered List"></button>
      </span>
      <span class="ql-formats">
        <button class="${focusStyles} rounded-sm ql-blockquote" title="Quote" aria-label="Quote"></button>
        <button class="${focusStyles} rounded-sm ql-code-block" title="Code Block" aria-label="Code Block"></button>
      </span>
      <span class="ql-formats">
        <button class="${focusStyles} rounded-sm ql-align" title="Align left" aria-label="Align left"></button>
        <button class="${focusStyles} rounded-sm ql-align" value="center" title="Align center" aria-label="Align center"></button>
        <button class="${focusStyles} rounded-sm ql-align" value="right" title="Align right" aria-label="Align right"></button>
        <button class="${focusStyles} rounded-sm ql-align" value="justify" title="Justify text" aria-label="Justify text"></button>
      </span>
      <span class="ql-formats">
        <button class="${focusStyles} rounded-sm ql-indent" value="-1" title="Dedent" aria-label="Dedent"></button>
        <button class="${focusStyles} rounded-sm ql-indent" value="+1" title="Indent" aria-label="Indent"></button>
      </span>
      <span class="ql-formats">
        <button class="${focusStyles} rounded-sm ql-clean" title="Clear Formatting" aria-label="Clear Formatting"></button>
      </span>
    </div>
    <div id="editor" class="${contentStyles} rounded-t-none ${focusStyles}"></div>
    <div class="flex justify-end mt-3">
    <button id="seal" class="${buttonStyles} ${focusStyles}">Seal this message</button>
    </div>
    `;
}
