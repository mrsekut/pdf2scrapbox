import nodeCanvas from 'canvas';
import { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import fs from 'fs/promises';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';
import { range } from './utils/utils';

type ImagePath = string;

export async function readPDF(path: string) {
  const buffer = await fs.readFile(path);
  const src = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({
    data: src,
    cMapUrl: './node_modules/pdfjs-dist/cmaps/',
    cMapPacked: true,
  }).promise;
  const pages = await Promise.all(
    range(doc.numPages).map(i => doc.getPage(i + 1)),
  );

  return pages;
}

export async function generateImageFromPDF(
  page: PDFPageProxy,
  scale: number,
  savePath: string,
): Promise<ImagePath> {
  const { width, height } = await getViewport([page], scale);
  const canvas = nodeCanvas.createCanvas(width, height);
  const context = canvas.getContext('2d');

  await page.render({
    canvasContext: context,
    viewport: page.getViewport({ scale }),
  }).promise;

  await fs.writeFile(savePath, canvas.toBuffer());

  return savePath;
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
      [0, 0],
    )
    .map(x => x * scale);

  return { width, height };
}
