import {
  buttonStyles,
  contentStyles,
  focusStyles,
  proseStyles,
} from './common';

export type Props = {
  id: string;
};

export default function Reader({ id }: Props) {
  return `
<div id="message" class="hidden ${proseStyles}">
</div>
<button
  id="read"
  class="${buttonStyles} ${focusStyles}"
  data-id="${id}"
  disabled="true"
>Validating message...</button>
  `;
}
