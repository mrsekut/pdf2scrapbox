import nodeCanvas from 'canvas';
import { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import fs from 'fs/promises';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';
import { pad, range } from './utils';
import { saveImage } from './file';

import * as dotenv from 'dotenv';
dotenv.config();

/**
 *
 * Types
 *
 */

type Config = {
  scale: number;
  keta: number;
};

type ImagePath = string;

/**
 *
 * functions
 *
 */

export async function readPDF(path: string) {
  const src = await fs.readFile(path);
  const doc = await pdfjs.getDocument(src).promise;
  const pages = await Promise.all(
    range(doc.numPages).map(i => doc.getPage(i + 1))
  );

  return pages;
}

export async function generateImagesFromPDF(
  pages: PDFPageProxy[],
  config: Config,
  filename: string,
  startIndex: number
): Promise<ImagePath[]> {
  const { width, height } = await getViewport(pages, config.scale);
  const canvas = nodeCanvas.createCanvas(width, height);
  const context = canvas.getContext('2d');

  const imgPaths: string[] = [];

  for await (const [i, page] of pages.entries()) {
    await page.render({
      canvasContext: context,
      viewport: page.getViewport({ scale: config.scale })
    }).promise;

    const id = pad(i + startIndex, config.keta);
    const file = await saveImage(canvas.toBuffer(), filename, id);
    imgPaths.push(file);
  }

  return imgPaths;
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
