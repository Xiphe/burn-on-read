import { static as asset } from '@architect/functions';
import { focusStyles } from './common';

export type DocumentProps = {
  children: string;
  title: string;
  navId: string;
};

const currentNavStyles = `${focusStyles} bg-stone-50 dark:bg-stone-900 text-stone-950 dark:text-stone-50 rounded-md px-3 py-2 text-sm font-medium`;
const navStyles = `${focusStyles} text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-stone-900 dark:hover:text-stone-50 rounded-md px-3 py-2 text-sm font-medium`;

const nav: Record<string, [path: string, name: string]> = {
  about: ['/', 'About'],
  write: ['/write', 'Write a Burn on Read Message'],
  // read: ['/read', 'Read'],
};

export default function Document({ children, navId, title }: DocumentProps) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
 <meta charset="UTF-8">
 <title>${title}</title>
 <meta name="viewport" content="width=device-width, initial-scale=1">
 <link rel="shortcut icon" href="${asset('/favicon.png')}">
 <link rel="stylesheet" href="${asset('/styles.css')}">
 <script src="${asset('/script.js')}" defer type="module"></script>
</head>
<body class="bg-stone-100 text-stone-950 dark:bg-stone-900 dark:text-stone-50">

  <div class="min-h-full">
    <div class="bg-gray-300 dark:bg-gray-700 pb-32">
      <nav >
        <div class="mx-auto max-w-5xl sm:px-6 lg:px-8">
          <div class="border-b border-gray-400 dark:border-gray-600">
            <div class="flex h-16 items-center justify-between px-4 sm:px-0">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <img class="h-8 w-8" src="${asset(
                    '/favicon.png',
                  )}" alt="Burn on Read">
                </div>
                <div>
                  <div class="ml-10 flex items-baseline space-x-4">
                    ${Object.entries(nav)
                      .map(
                        ([id, [path, name]]) =>
                          `<a href="${path}" ${
                            id === navId
                              ? `class="${currentNavStyles}" aria-current="page"`
                              : `class="${navStyles}"`
                          }>${name}</a>`,
                      )
                      .join('')}
                    <!-- Current: "bg-stone-900 text-white", Default: "text-stone-300 hover:bg-stone-700 hover:text-white" -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <header class="py-10">
        <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-bold tracking-tight text-stone-950 dark:text-stone-50">${title}</h1>
        </div>
      </header>
    </div>
    <main class="-mt-32">
      <div class="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
        ${children}
      </div>
    </main>
  </div>
</body>
</html>
`;
}

// <div class="container ">
// ${children}
// </div>
