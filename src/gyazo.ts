import * as dotenv from 'dotenv';
dotenv.config();

export function getHash(gyazoUrl: string) {
  return gyazoUrl.match(/gyazo.com\/([0-9a-f]{32})/i)[1];
}
