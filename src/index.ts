import { getFileInfo, mkdir } from 'app/utils/file';
import { generateImageFromPDF, readPDF } from 'app/pdf';
import * as Gyazo from './gyazo';
import { renderPage, saveJson } from 'app/renderScrapboxPage';

import { sleep } from 'app/utils/utils';
import * as dotenv from 'dotenv';
import type { PDFPageProxy } from 'pdfjs-dist';
import Bottleneck from 'bottleneck';
import cliProgress from 'cli-progress';

import fs from 'fs';
import path from 'path';

dotenv.config();

type Config = {
  scale: number;
  waitTimeForOcr: number; // GyazoにアップロードしてからOCRが生成されるまでの待機時間(ms)
  dir: string;
};

export async function main(config: Config) {
  const files = fs.readdirSync(config.dir);
  const pdfs = files.filter(file => path.extname(file) === '.pdf');

  for (const pdf of pdfs) {
    const filepath = path.join(config.dir, pdf);
    await processSinglePDF(config, filepath);
  }
}

async function processSinglePDF(config: Config, filepath: string) {
  const { filename } = getFileInfo(filepath, '.pdf');

  await mkdir(filename);

  const pdfs = await readPDF(filepath);

  const limiter = new Bottleneck({
    maxConcurrent: 30,
    minTime: 1000,
  });

  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic,
  );

  progressBar.start(pdfs.length, 0);

  const pages = await Promise.all(
    pdfs.map((pdf, index) =>
      limiter.schedule(() => {
        progressBar.increment();
        return generatePage(pdf, filename, index, pdfs.length, config);
      }),
    ),
  );

  progressBar.stop();

  await saveJson(`out/${filename}-ocr.json`, { pages });
}

const generatePage = async (
  pdf: PDFPageProxy,
  filename: string,
  index: number,
  pageLength: number,
  config: Config,
) => {
  const path = `out/${filename}/${index}.jpg`;

  const imagePath = await generateImageFromPDF(pdf, config.scale, path);
  const gyazoImageId = await Gyazo.upload(imagePath);

  await sleep(config.waitTimeForOcr);

  const ocr = await Gyazo.getGyazoOCR(gyazoImageId);
  const page = renderPage(index, pageLength, gyazoImageId, ocr);

  return page;
};
