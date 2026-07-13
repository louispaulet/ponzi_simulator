import { copyFile, mkdir } from 'node:fs/promises';

const distUrl = new URL('../dist/', import.meta.url);
const entryUrl = new URL('index.html', distUrl);
const routeEntries = [
  'simulator',
  'hall-of-harm',
  'methodology',
  'learn',
  'learn/ponzi-schemes',
  'learn/pyramid-schemes',
  'learn/mlm',
  'learn/warning-signs',
  'cases/charles-ponzi',
  'cases/madoff',
  'cases/stanford',
  'cases/zeek-rewards',
  'cases/forsage',
  'cases/burnlounge',
];

await copyFile(entryUrl, new URL('404.html', distUrl));

await Promise.all(
  routeEntries.map(async (route) => {
    const routeDirectory = new URL(`${route}/`, distUrl);
    await mkdir(routeDirectory, { recursive: true });
    await copyFile(entryUrl, new URL('index.html', routeDirectory));
  }),
);
