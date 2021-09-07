import Gyazo from 'gyazo-api';

import request from 'request';
import * as dotenv from 'dotenv';
dotenv.config();

type Url = string;

export type GyazoOCR = {
  image_id: string;
  type: 'png';
  created_at: string;
  permalink_url: Url;
  thumb_url: Url;
  url: Url;
  metadata: {
    app: null;
    title: null;
    original_title: null;
    url: null;
    original_url: null;
    desc: '';
  };
  ocr: {
    locale: 'en';
    description: string;
  };
};

export async function uploads(files: string[]) {
  const urls = await Promise.all(
    files.map(async file => {
      const gyazo = new Gyazo(process.env['GYAZO_TOKEN']); // FIXME: any
      const res = await gyazo.upload(file);
      return res.data.permalink_url as string;
    })
  );
  return urls;
}

export function fetchImage(imageId: string) {
  const access_token = process.env['GYAZO_TOKEN'] as string;

  // FIXME:
  return new Promise((resolve, reject) => {
    request.get(
      {
        url: `https://api.gyazo.com/api/images/${imageId}`,
        qs: { access_token, image_id: imageId }
      },
      (err, res) => {
        if (err) return reject(err);
        if (res.statusCode !== 200) return reject(res.body);

        const a: GyazoOCR = JSON.parse(res.body);
        resolve(a);
      }
    );
  });
}

// FIXME: type
export function getHash(gyazoUrl: string) {
  const m = gyazoUrl.match(/gyazo.com\/([0-9a-f]{32})/i);
  if (m == null) {
    return '';
  }
  return m[1];
}
