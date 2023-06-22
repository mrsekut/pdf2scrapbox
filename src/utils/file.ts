import fs from 'fs/promises';
import path from 'path';

type Extension = '.json' | '.pdf';

export function getFileInfo(extension: Extension) {
  if (process.argv.slice(2) == null) {
    throw new Error('invalid argument');
  }

  const filepath = process.argv[2];
  return {
    filepath,
    filename: path.basename(filepath, extension)
  };
}

export async function mkdir(filename: string) {
  try {
    await fs.stat(`out/${filename}`);
  } catch {
    await fs.mkdir(`out/${filename}`, { recursive: true });
  }
}
