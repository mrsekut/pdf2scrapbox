import fs from 'fs/promises';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';
import nodeCanvas from 'canvas';
import { PDFPageProxy } from 'pdfjs-dist/types/display/api';

import * as dotenv from 'dotenv';
import { range } from './utils';
import * as Gyazo from './gyazo';
import { getFileInfo, mkdir, saveImage } from './file';
import { PageWithGyazo, saveJson } from './scrapbox';
dotenv.config();

/**
 * Types
 */

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

  const files = await makeImagesFromPDF(pdfs, config, filename);
  const urls = await Gyazo.uploads(files);
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

async function getViewport(pages: PDFPageProxy[], scale: number) {
  const [width, height] = pages
    .map(page => {
      const viewport = page.getViewport();
      const [, , w, h] = viewport.viewBox;
      return [w, h];
    })
    .reduce(
      ([width, height], [w, h]) => [Math.max(width, w), Math.max(height, h)],
      [0, 0]
    )
    .map(x => x * scale);

  return { width, height };
}

type ImagePath = string;

async function makeImagesFromPDF(
  pages: PDFPageProxy[],
  config: Config,
  filename: string
): Promise<ImagePath[]> {
  const { width, height } = await getViewport(pages, config.scale);
  const canvas = nodeCanvas.createCanvas(width, height);
  const context = canvas.getContext('2d');

  const files: string[] = [];
  for (let [i, page] of pages.map((page, i) => [i, page] as const)) {
    await page.render({
      canvasContext: context,
      viewport: page.getViewport({ scale: config.scale })
    }).promise;

    const id = pad(i, config.keta);
    const file = await saveImage(canvas.toBuffer(), filename, id);
    files.push(file);
  }

  return files;
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

function pad(num: number, keta: number) {
  return num.toString().padStart(keta, '0');
}
