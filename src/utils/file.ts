import fs from 'node:fs/promises';
import np from 'node:path';

export type Path = string;

export const getPDFs = async (path: Path): Promise<Path[]> => {
  const files = await fs.readdir(path);
  return files
    .filter(file => np.extname(file) === '.pdf')
    .map(file => np.join(path, file));
};

export const getImageDirs = async (dirPath: string): Promise<string[]> => {
  const files = await fs.readdir(dirPath);

  const dirs = await Promise.all(
    files.map(async file => {
      const fullPath = np.join(dirPath, file);
      const stats = await fs.lstat(fullPath);
      return stats.isDirectory() ? fullPath : null;
    }),
  );

  return dirs.filter(d => d != null);
};

export const getImages = async (path: Path): Promise<Path[]> => {
  const files = await fs.readdir(path);
  return files
    .filter(file => np.extname(file) === '.jpg' || np.extname(file) === '.png')
    .map(file => np.join(path, file));
};

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
