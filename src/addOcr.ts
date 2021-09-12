import fs from 'fs/promises';
import * as dotenv from 'dotenv';
import { getFileInfo } from './file';
import { fetchImage, GyazoOCR } from './gyazo';
import { Page, PageWithGyazo, ProjectWithGyazo, saveJson } from './scrapbox';
dotenv.config();

main();

async function main() {
  const { filename, filepath } = getFileInfo('.json');

  const project = await getProjectFrom(filepath);
  const pages = await makePages(project);
  await saveJson(`out/${filename}-ocr.json`, { pages });
}

/**
 *
 */
async function makePages(project: ProjectWithGyazo): Promise<Page[]> {
  return await Promise.all(project.pages.reverse().map(makePage));
}

async function makePage({ title, lines, gyazo }: PageWithGyazo) {
  const g = (await fetchImage(gyazo)) as GyazoOCR;
  const ocrLines = g.ocr.description.split('\n').map(line => '>' + line);
  return { title, lines: [...lines, '', ...ocrLines] };
}

async function getProjectFrom(filepath: string): Promise<ProjectWithGyazo> {
  const buf = await fs.readFile(filepath);
  const project = JSON.parse(buf.toString());
  return project;
}
