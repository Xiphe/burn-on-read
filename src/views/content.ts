import { contentStyles } from './common';

export type Props = { children: string };

export default function Content({ children }: Props) {
  return `
<div class="${contentStyles}">
${children}
</div>
  `;
}
