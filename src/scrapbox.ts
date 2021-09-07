import fs from 'fs/promises';

export type Project = {
  pages: Page[];
};

export type Page = {
  title: string;
  lines: string[];
};

export type ProjectWithGyazo = {
  pages: PageWithGyazo[];
};

export type PageWithGyazo = Page & {
  gyazo: string;
};

export async function saveJson(path: string, newJson: Project) {
  fs.writeFile(path, JSON.stringify(newJson));
}
