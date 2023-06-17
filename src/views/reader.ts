import { buttonStyles, focusStyles } from './common';

export type Props = {
  id: string;
};

export default function Reader({ id }: Props) {
  return `
<button
  id="read"
  class="${buttonStyles} ${focusStyles}"
  data-id="${id}"
  disabled="true"
>Validating message...</button>
  `;
}
