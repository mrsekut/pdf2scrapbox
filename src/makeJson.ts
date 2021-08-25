import fs from "fs/promises";
import path from "path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.js";
import nodeCanvas from "canvas";
import Gyazo from "gyazo-api";
import { PDFPageProxy } from "pdfjs-dist/types/display/api";

import * as dotenv from 'dotenv'
dotenv.config();



// Types

type Config = {
  scale: number;
  keta: number;
}


// Main

main();


async function main() {
  const { filename, filepath } = getFileInfo();

  await mkdir(filename);

  const pages = await readPDF(filepath);

  const config: Config = {
    scale: 300 / 72,
    keta: pages.length.toString().length
  }

  const files = await saveImages(pages, config, filename);
  const urls = await uploadsToGyazo(files);
  await saveJson(urls, filename, config);
}


function getFileInfo() {
  if (process.argv[2] == null) {
    throw new Error('invalid argument');
  }

  const filepath = process.argv[2];
  return {
    filepath,
    filename: path.basename(filepath, ".pdf")
  };
}


async function mkdir(filename: string) {
  try {
    await fs.stat(`out/${filename}`);
  } catch {
    await fs.mkdir(`out/${filename}`, { recursive: true });
  }
}


async function readPDF(path: string) {
  const src = await fs.readFile(path);
  const doc = await pdfjs.getDocument(src).promise;
  const pages = await Promise.all(range(doc.numPages).map(i => doc.getPage(i + 1)))

  return pages
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

  return { width, height }
}


async function saveImages(pages: PDFPageProxy[], config: Config, filename: string) {
  const { width, height } = await getViewport(pages, config.scale);
  const canvas = nodeCanvas.createCanvas(width, height);
  const context = canvas.getContext("2d");

  const files: string[] = [];
  for (let [i, page] of pages.map((page, i) => [i, page] as const)) {
    await page.render({
      canvasContext: context,
      viewport: page.getViewport({ scale: config.scale }),
    }).promise;

    const id = pad(i, config.keta);
    const file = await saveImage(canvas.toBuffer(), filename, id)
    files.push(file);
  }

  return files;
}


async function uploadsToGyazo(files: string[]) {
  const urls = await Promise.all(
    files.map(async file => {
      const gyazo = new Gyazo(process.env['GYAZO_TOKEN']); // FIXME: any
      const res = await gyazo.upload(file);
      return res.data.permalink_url as string;
    })
  );
  return urls;
}


async function saveJson(urls: string[], filename: string, config: Config) {
  const json = await Promise.all(
    urls.map((url, i) => {
      const id = pad(i, config.keta);
      const pageN = pageNum(i, config.keta, urls.length);
      return renderPage(id, pageN, url);
    })
  );

  fs.writeFile(`out/${filename}.json`, JSON.stringify(json));
}


async function saveImage(buffer: Buffer, filename: string, id: string) {
  const file = `out/${filename}/${id}.jpg`;
  await fs.writeFile(file, buffer);

  return file;
}


type PageNum = {
  prev: string;
  next: string;
}

function renderPage(title: string, pageNum: PageNum, url: string) {
  const lines = [
    title,
    `[${pageNum.prev}] [${pageNum.next}]`,
    `[[${url}]]`,
    `[${pageNum.prev}] [${pageNum.next}]`,
  ];

  return { title, lines }
}


function pageNum(i: number, keta: number, length: number) {
  const p = pad(i > 0 ? i - 1 : i, keta);
  const n = pad(i < length - 1 ? i + 1 : i, keta);
  return { prev: p, next: n };
}


function pad(num: number, keta: number) {
  return num.toString().padStart(keta, "0");
}



// Utils

function range(n1: number, n2?: number) {
  if (n2 == null) {
    return [...new Array(n1).keys()];
  }

  const start = n1;
  const end = n2;
  return [...Array(end - start + 1)].map((_, i) => start + i);
};