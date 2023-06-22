import * as dotenv from 'dotenv';
import { chunk, pad, sleep } from './utils/utils';
import * as Gyazo from './gyazo';
import { getFileInfo, mkdir } from './utils/file';
import { PageWithGyazo, saveJson } from './scrapbox';
import { generateImagesFromPDF, readPDF } from './pdf';
import { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
dotenv.config();

/**
 *
 * Types
 *
 */

// FIXME: move:pdf
type Config = {
  scale: number;
  keta: number;
  length: number;
};

/**
 *
 * Main
 *
 */

main(50, 20_000);

// FIXME: log
async function main(per: number, intervalMS: number) {
  const { filename, filepath } = getFileInfo('.pdf');

  await mkdir(filename);

  const pdfs = await readPDF(filepath);

  const config: Config = {
    scale: 300 / 72,
    keta: pdfs.length.toString().length,
    length: pdfs.length
  };

  const results = await batches(
    chunk(pdfs, per),
    intervalMS,
    async (xs: PDFPageProxy[], index: number) => {
      const pages = await batch(xs, index, config, filename);
      await saveJson(`out/${filename}-${index}.json`, { pages: pages.pages });
      return pages;
    }
  );

  try {
    await saveJson(`out/${filename}.json`, { pages: concatPages(results) });
    console.log('success');
  } catch (e) {
    console.error(e);
  }
}

/**
 *
 * Functions
 *
 */

async function batch(
  pdfs: PDFPageProxy[],
  index: number,
  config: Config,
  filename: string
) {
  const imgPaths = await generateImagesFromPDF(pdfs, config, filename, index);
  const urls = await Gyazo.uploads(imgPaths);
  return await makePages(urls, config, index);
}

async function batches<T, R>(
  xss: T[][],
  milliseconds: number,
  batch: (xs: T[], index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];

  let index = 0;
  for await (const xs of xss) {
    const result = await batch(xs, index);
    results.push(result);
    console.log(`${index}=============================`);
    index += xs.length;
    await sleep(milliseconds);
  }

  return results;
}

async function makePages(
  urls: Gyazo.GyazoUrl[],
  config: Config,
  startIndex: number
) {
  const pages = await Promise.all(
    urls.map((url, i) => {
      const id = pad(i + startIndex, config.keta);
      const pageN = pageNum(i + startIndex, config.length, config.keta);
      return renderPage(id, pageN, url);
    })
  );

  return {
    range: {
      start: startIndex,
      end: pages.length + startIndex - 1
    },
    pages
  };
}

type PageNum = {
  prev: string;
  next: string;
};

function renderPage(
  title: string,
  pageNum: PageNum,
  gyazoUrl: Gyazo.GyazoUrl
): PageWithGyazo {
  const lines = [
    title,
    `prev: [${pageNum.prev}]`,
    `next: [${pageNum.next}]`,
    `[[${gyazoUrl}]]`
  ];

  return { title, lines, gyazo: Gyazo.getHash(gyazoUrl) };
}

export function pageNum(current: number, length: number, keta: number) {
  return {
    prev: pad(current === 0 ? current : current - 1, keta),
    next: pad(current === length - 1 ? current : current + 1, keta)
  };
}

type Range = {
  start: number;
  end: number;
};

function concatPages(pages: { range: Range; pages: PageWithGyazo[] }[]) {
  if (!validate(pages.map(p => p.range))) {
    console.log(pages);
    throw new Error('invalid pages');
  }

  return pages.reduce(
    (acc: PageWithGyazo[], cur) => [...acc, ...cur.pages],
    []
  );
}

export function validate(xs: Range[]) {
  const pairs = xs
    .reduce((acc: number[], cur) => [...acc, cur.start, cur.end], [])
    .slice(1) // remove head
    .slice(0, -1); // remove last

  return chunk(pairs, 2).every(v => v[0] + 1 === v[1]);
}
