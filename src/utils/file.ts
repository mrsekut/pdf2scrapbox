import fs from 'fs/promises';
import path from 'path';

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

export async function mkdir(filename: string) {
  try {
    await fs.stat(`out/${filename}`);
  } catch {
    await fs.mkdir(`out/${filename}`, { recursive: true });
  }
}
