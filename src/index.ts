import { getFileInfo, mkdir } from 'app/utils/file';
import { generateImageFromPDF, readPDF } from 'app/pdf';
import * as Gyazo from './gyazo';
import { renderPage, saveJson } from 'app/renderScrapboxPage';

import { sleep } from 'app/utils/utils';
import * as dotenv from 'dotenv';
import type { PDFPageProxy } from 'pdfjs-dist';
import Bottleneck from 'bottleneck';
import cliProgress from 'cli-progress';

dotenv.config();

type Config = {
  scale: number;
};

export async function main(config: Config) {
  const { filename, filepath } = getFileInfo('.pdf');

  await mkdir(filename);

  const pdfs = await readPDF(filepath);

  const limiter = new Bottleneck({
    maxConcurrent: 50, // Maximum of 50 concurrent jobs
    minTime: 333
  });

  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );

  progressBar.start(pdfs.length, 0);

  const pages = await Promise.all(
    pdfs.map((pdf, index) =>
      limiter.schedule(() => {
        progressBar.increment();
        return generatePage(pdf, filename, index, config.scale);
      })
    )
  );

  progressBar.stop();

  await saveJson(`out/${filename}-ocr.json`, { pages });
}

const generatePage = async (
  pdf: PDFPageProxy,
  filename: string,
  index: number,
  scale: number
) => {
  const path = `out/${filename}/${index}.jpg`;

  const imagePath = await generateImageFromPDF(pdf, scale, path);
  const gyazoImageId = await Gyazo.upload(imagePath);

  await sleep(3000);

  const ocr = await Gyazo.getGyazoOCR(gyazoImageId);
  const page = renderPage(index, gyazoImageId, ocr);

  return page;
};
