import type { GyazoImageId } from 'app/gyazo';
import { pad } from 'app/utils/utils';
import fs from 'fs/promises';

type Project = {
  pages: Page[];
};

type Page = {
  title: string;
  lines: string[];
};

export async function saveJson(path: string, newJson: Project) {
  fs.writeFile(path, JSON.stringify(newJson));
}

export function renderPage(
  index: number,
  pageLength: number,
  gyazoImageId: GyazoImageId,
  ocrText: string,
) {
  const _pad = pad(`${pageLength}`.length);

  const title = _pad(index);
  const page = pageNum(index);
  const url = `https://gyazo.com/${gyazoImageId}`;
  const ocrLines = ocrText.split('\n').map(line => '>' + line);

  const lines = [
    `${title}`,
    `prev: [${_pad(page.prev)}]`,
    `next: [${_pad(page.next)}]`,
    `[[${url}]]`,
    '',
    ...ocrLines,
  ];

  return {
    title: `${title}`,
    lines,
  };
}

type PageNum = {
  prev: number;
  next: number;
};

function pageNum(current: number): PageNum {
  return {
    prev: current === 0 ? current : current - 1,
    next: current + 1,
  };
}
