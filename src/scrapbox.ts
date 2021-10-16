import fs from 'fs/promises';
import * as t from 'io-ts';

/**
 *
 * Types
 *
 */
export type Page = t.TypeOf<typeof Page>;

type Project = t.TypeOf<typeof Project>;

export type ProjectWithGyazo = t.TypeOf<typeof ProjectWithGyazo>;

export type PageWithGyazo = t.TypeOf<typeof PageWithGyazo>;

/**
 *
 * io-ts
 *
 */
const Page = t.type({
  title: t.string,
  lines: t.array(t.string)
});

const Project = t.type({
  pages: t.array(Page)
});

const PageWithGyazo = t.intersection([Page, t.type({ gyazo: t.string })]);

const ProjectWithGyazo = t.type({
  pages: t.array(PageWithGyazo)
});

/**
 *
 * functions
 *
 */
export async function saveJson(path: string, newJson: Project) {
  fs.writeFile(path, JSON.stringify(newJson));
}
