import fs from 'node:fs/promises';
import np from 'node:path';
import { pdf } from 'pdf-to-img';
import { range } from './utils/utils.js';
import { Path, fileInfo, mkdir } from 'app/utils/file.js';

export async function pdfs2images(
  pdfs: Path[],
  outDir: string,
): Promise<Path[]> {
  return Promise.all(pdfs.map(pdf => pdf2images(pdf, outDir)));
}

/**
 * - take a path of pdf
 * - convert pdf to images
 * - create outDir
 * - save to outDir
 */
async function pdf2images(pdf: Path, outDir: string): Promise<Path> {
  const { filename } = fileInfo(pdf);
  const outPath = np.join(outDir, filename);
  const imgs = await pdfToImages(pdf);

  await mkdir(outPath);

  Promise.all(
    imgs.map((img, index) => saveFiles(img, `${outPath}/${index}.jpg`)),
  );

  return outPath;
}

async function pdfToImages(path: Path): Promise<Buffer[]> {
  const buffer = await fs.readFile(path);
  const src = new Uint8Array(buffer);
  const doc = await pdf(src, { scale: 3 });
  const pages = await Promise.all(
    range(doc.length).map(i => doc.getPage(i + 1)),
  );

  return pages;
}

async function saveFiles(img: Buffer, path: string) {
  await fs.writeFile(path, img);
  return path;
}
