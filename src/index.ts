import path from 'node:path';
import Bottleneck from 'bottleneck';
import cliProgress from 'cli-progress';
import * as dotenv from 'dotenv';

import { sleep } from 'app/utils/utils.js';
import { getFileInfo, getPDFs, mkdir } from 'app/utils/file.js';

import { readPDF, saveFiles } from 'app/pdf.js';
import * as Gyazo from './gyazo.js';
import { renderPage, saveJson } from 'app/renderScrapboxPage.js';
import { ProfilePath, createProfilePage } from 'app/profilePage.js';

dotenv.config();

type Config = {
  scale: number;
  waitTimeForOcr: number; // GyazoにアップロードしてからOCRが生成されるまでの待機時間(ms)
  workspace: string;
  profile?: ProfilePath;
};

export async function main(config: Config) {
  const pdfs = await getPDFs(config.workspace);

  for (const pdf of pdfs) {
    const filepath = path.join(config.workspace, pdf);
    await processSinglePDF(config, filepath);
  }
}

async function processSinglePDF(config: Config, filepath: string) {
  const { filename } = getFileInfo(filepath, '.pdf');

  console.log(`\nProcessing PDF: ${filename}\n`);

  await mkdir(filename);

  const imgs = await readPDF(filepath);

  const limiter = new Bottleneck({
    maxConcurrent: 30,
    minTime: 1000,
  });

  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic,
  );

  progressBar.start(imgs.length, 0);

  const pages = await Promise.all(
    imgs.map((img, index) =>
      limiter.schedule(() => {
        progressBar.increment();
        return generatePage(img, filename, index, imgs.length, config);
      }),
    ),
  );

  const pagesWithProfile = await (async () => {
    if (config.profile == null) return pages;

    const profilePage = await createProfilePage(config.profile);
    return [...pages, profilePage];
  })();

  progressBar.stop();

  // TODO: out
  await saveJson(`out/${filename}-ocr.json`, { pages: pagesWithProfile });

  console.log(`Finished processing PDF: ${filename}\n`);
}

const generatePage = async (
  img: Buffer,
  filename: string,
  index: number,
  pageLength: number,
  config: Config,
) => {
  const path = `out/${filename}/${index}.jpg`;

  const imagePath = await saveFiles(img, path);
  const gyazoImageId = await Gyazo.upload(imagePath);

  await sleep(config.waitTimeForOcr);

  const ocr = await Gyazo.getGyazoOCR(gyazoImageId);
  const page = renderPage(index, pageLength, gyazoImageId, ocr);

  return page;
};
