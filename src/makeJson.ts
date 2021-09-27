import fs from 'fs/promises';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';

import * as dotenv from 'dotenv';
import { pad, range } from './utils';
import * as Gyazo from './gyazo';
import { getFileInfo, mkdir } from './file';
import { PageWithGyazo, saveJson } from './scrapbox';
import { generateImagesFromPDF } from './pdf';
dotenv.config();

/**
 * Types
 */

// FIXME: move:pdf
type Config = {
  scale: number;
  keta: number;
};

/**
 * Main
 */

main();

async function main() {
  const { filename, filepath } = getFileInfo('.pdf');

  await mkdir(filename);

  const pdfs = await readPDF(filepath);

  const config: Config = {
    scale: 300 / 72,
    keta: pdfs.length.toString().length
  };

  const imgPaths = await generateImagesFromPDF(pdfs, config, filename);
  const urls = await Gyazo.uploads(imgPaths);
  const pages = await makePages(urls, config);

  await saveJson(`out/${filename}.json`, { pages });
}

async function readPDF(path: string) {
  const src = await fs.readFile(path);
  const doc = await pdfjs.getDocument(src).promise;
  const pages = await Promise.all(
    range(doc.numPages).map(i => doc.getPage(i + 1))
  );

  return pages;
}

async function makePages(urls: string[], config: Config) {
  const pages = await Promise.all(
    urls.map((url, i) => {
      const id = pad(i, config.keta);
      const pageN = pageNum(i, config.keta, urls.length);
      return renderPage(id, pageN, url);
    })
  );
  return pages;
}

type PageNum = {
  prev: string;
  next: string;
};

function renderPage(
  title: string,
  pageNum: PageNum,
  gyazoUrl: string
): PageWithGyazo {
  const lines = [
    title,
    `[${pageNum.prev}] [${pageNum.next}]`,
    `[[${gyazoUrl}]]`,
    `[${pageNum.prev}] [${pageNum.next}]`
  ];

  return { title, lines, gyazo: Gyazo.getHash(gyazoUrl) };
}

function pageNum(i: number, keta: number, length: number) {
  const p = pad(i > 0 ? i - 1 : i, keta);
  const n = pad(i < length - 1 ? i + 1 : i, keta);
  return { prev: p, next: n };
}
