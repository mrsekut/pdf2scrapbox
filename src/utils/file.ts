import fs from 'node:fs/promises';
import path from 'node:path';

export const getPDFs = async (path_: string) => {
  const files = await fs.readdir(path_);
  return files.filter(file => path.extname(file) === '.pdf');
};

export const getImageDirs = async (path_: string) => {
  const files = await fs.readdir(path_);
  return files.filter(async file => {
    const stats = await fs.lstat(path.join(path_, file));
    return stats.isDirectory();
  });
};

type Extension = '.json' | '.pdf';

export function getFileInfo(filepath: string, extension: Extension) {
  if (filepath === '') {
    throw new Error('invalid argument');
  }

  return {
    filepath,
    filename: path.basename(filepath, extension),
  };
}

// TODO: out
export async function mkdir(filename: string) {
  try {
    await fs.stat(`out/${filename}`);
  } catch {
    await fs.mkdir(`out/${filename}`, { recursive: true });
  }
}
