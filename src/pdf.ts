import fs from 'node:fs/promises';
import { pdf } from 'pdf-to-img';
import { range } from './utils/utils.js';

export async function readPDF(path: string): Promise<Buffer[]> {
  const buffer = await fs.readFile(path);
  const src = new Uint8Array(buffer);
  const doc = await pdf(src, { scale: 3 });
  const pages = await Promise.all(
    range(doc.length).map(i => doc.getPage(i + 1)),
  );

  return pages;
}

export async function saveFiles(img: Buffer, path: string) {
  await fs.writeFile(path, img);
  return path;
}
