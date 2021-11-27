import Gyazo from 'gyazo-api';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import request from 'request';
import { Newtype, iso } from 'newtype-ts';

import * as dotenv from 'dotenv';
dotenv.config();

/**
 *
 * Types
 *
 */
export type GyazoOCR = t.TypeOf<typeof GyazoOCR>;

export interface GyazoUrl
  extends Newtype<{ readonly GyazoUrl: unique symbol }, string> {}
const isoGyazoUrl = iso<GyazoUrl>();

/**
 *
 * io-ts
 *
 */

const Url = t.string;

const MetaData = t.type({
  app: t.null,
  title: t.null,
  original_title: t.null,
  url: t.null,
  original_url: t.null,
  desc: t.literal('')
});

const Locale = t.keyof({
  ja: null,
  en: null
});

const Ocr = t.union([
  t.type({ locale: Locale, description: t.string }),
  t.type({ locale: t.null, description: t.literal('') })
]);

const GyazoOCR = t.type({
  image_id: t.string,
  type: t.literal('png'),
  created_at: t.string, // FIXME: Date
  permalink_url: Url,
  thumb_url: Url,
  url: Url,
  metadata: MetaData,
  ocr: Ocr
});

/**
 *
 * functions
 *
 */

export async function uploads(images: string[]) {
  const urls = await Promise.all(
    images.map(async file => {
      const gyazo = new Gyazo(process.env['GYAZO_TOKEN']); // FIXME: any
      const res = await gyazo.upload(file);
      return isoGyazoUrl.wrap(res.data.permalink_url)
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

        const r = GyazoOCR.decode(JSON.parse(res.body));
        console.log(PathReporter.report(r));

        pipe(
          r,
          E.fold(
            e => reject(e),
            r => resolve(r)
          )
        );
      }
    );
  });
}

export function getHash(gyazoUrl: GyazoUrl) {
  const m = isoGyazoUrl.unwrap(gyazoUrl).match(/gyazo.com\/([0-9a-f]{32})/i);
  if (m == null) {
    return '';
  }
  return m[1];
}
