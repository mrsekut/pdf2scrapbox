import * as dotenv from 'dotenv';

import { sleep } from 'app/utils/utils.js';
import { Path, getImageDirs, getImages, getPDFs } from 'app/utils/file.js';
import { pdfs2images } from 'app/pdf.js';
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

// TODO: log
export async function main(config: Config) {
  const pdfPaths = await getPDFs(config.workspace);
  await pdfs2images(pdfPaths, config.workspace);

  const dirs = await getImageDirs(config.workspace);
  await dirs2Cosense(config, dirs);
}

async function dirs2Cosense(config: Config, dirPaths: Path[]) {
  Promise.all(dirPaths.map(dirPath => dir2Cosense(config, dirPath)));
}

async function dir2Cosense(config: Config, dirPath: Path) {
  const images = await getImages(dirPath);
  const pages = await Promise.all(
    images.map((img, index) => {
      return generatePage(img, index, images.length, config);
    }),
  );

  const pagesWithProfile = await (async () => {
    if (config.profile == null) return pages;

    const profilePage = await createProfilePage(config.profile);
    return [...pages, profilePage];
  })();

  await saveJson(`${dirPath}-ocr.json`, { pages: pagesWithProfile });
}

const generatePage = async (
  path: Path,
  index: number,
  pageLength: number,
  config: Config,
) => {
  const gyazoImageId = await Gyazo.upload(path);

  await sleep(config.waitTimeForOcr);

  const ocr = await Gyazo.getGyazoOCR(gyazoImageId);
  const page = renderPage(index, pageLength, gyazoImageId, ocr);

  return page;
};
