import nodeCanvas from 'canvas';
import { PDFPageProxy } from 'pdfjs-dist/types/display/api';

import * as dotenv from 'dotenv';
import { pad } from './utils';
import { saveImage } from './file';
import { Presets, SingleBar } from 'cli-progress';
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

const bar = new SingleBar(
  {
    format: '{bar} | {percentage}% | {value}/{total} images generated',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  },
  Presets.shades_classic
);

export async function generateImagesFromPDF(
  pages: PDFPageProxy[],
  config: Config,
  filename: string
): Promise<ImagePath[]> {
  const { width, height } = await getViewport(pages, config.scale);
  const canvas = nodeCanvas.createCanvas(width, height);
  const context = canvas.getContext('2d');

  const imgPaths: string[] = [];
  bar.start(pages.length, 0, { speed: 'N/A' });
  for (let [i, page] of pages.map((page, i) => [i, page] as const)) {
    await page.render({
      canvasContext: context,
      viewport: page.getViewport({ scale: config.scale })
    }).promise;

    const id = pad(i, config.keta);
    const file = await saveImage(canvas.toBuffer(), filename, id);
    imgPaths.push(file);
    bar.increment();
  }

  bar.stop();

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
