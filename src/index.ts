import { generateImageFromPDF, readPDF } from 'app/pdf';
import { renderPage, saveJson } from 'app/renderScrapboxPage';
import { getFileInfo, mkdir } from 'app/utils/file';
import * as dotenv from 'dotenv';
import { PDFPageProxy } from 'pdfjs-dist';
import * as Gyazo from './gyazo';
dotenv.config();

type Config = {
  scale: number;
};

export async function main(config: Config) {
  const { filename, filepath } = getFileInfo('.pdf');

  await mkdir(filename);

  const pdfs = await readPDF(filepath);
  const pages = await Promise.all(
    pdfs.map((pdf, index) => generatePage(pdf, filename, index, config.scale))
  );

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
  const ocr = await Gyazo.getGyazoOCR(gyazoImageId);
  const page = renderPage(index, gyazoImageId, ocr);
  return page;
};
