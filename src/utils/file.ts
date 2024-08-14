import fs from 'node:fs/promises';
import np from 'node:path';

export type Path = string;

export const getPDFs = async (path: Path): Promise<Path[]> => {
  const files = await fs.readdir(path);
  return files
    .filter(file => np.extname(file) === '.pdf')
    .map(file => np.join(path, file));
};

export const getImageDirs = async (path: Path): Promise<Path[]> => {
  const files = await fs.readdir(path);
  return files
    .filter(async file => {
      const stats = await fs.lstat(np.join(path, file));
      return stats.isDirectory();
    })
    .map(file => np.join(path, file));
};

type Extension = '.json' | '.pdf';

/**
 * e.g. fileInfo('out/2021-01-01/2021-01-01.pdf')
 * - path: 'out/2021-01-01/2021-01-01.pdf',
 * - dir: 'out/2021-01-01',
 * - name: '2021-01-01.pdf',
 * - filename: '2021-01-01',
 * - ext: '.pdf',
 */
export function fileInfo(path: Path) {
  return {
    path: path,
    dir: np.dirname(path),
    name: np.basename(path),
    filename: np.basename(path, np.extname(path)),
    ext: np.extname(path),
  };
}

/** @deprecated */
export function getFileInfo(filepath: Path, extension: Extension) {
  if (filepath === '') {
    throw new Error('invalid argument');
  }

  return {
    filepath,
    filename: np.basename(filepath, extension),
  };
}

/**
 * e.g. mkdir('out')
 * e.g. mkdir('out/2021-01-01')
 */
export async function mkdir(name: string) {
  try {
    await fs.stat(name);
  } catch {
    await fs.mkdir(name, { recursive: true });
  }
}
