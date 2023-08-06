import Gyazo from 'gyazo-api';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/lib/PathReporter';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { Newtype, iso } from 'newtype-ts';
import { withRetry } from 'app/utils/utils';

import * as dotenv from 'dotenv';
dotenv.config();

/**
 *
 * Types
 *
 */
export type GyazoOCR = t.TypeOf<typeof GyazoOCR>;

export interface GyazoImageId
  extends Newtype<{ readonly GyazoUrl: unique symbol }, string> {}
const isoGyazoImageId = iso<GyazoImageId>();

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

const Ocr = t.union([
  t.type({ locale: t.unknown, description: t.string }),
  t.type({ locale: t.null, description: t.literal('') }),
  t.undefined
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

export async function upload(imagePath: string) {
  const gyazo = new Gyazo(process.env['GYAZO_TOKEN']);

  // TODO: any
  const res = await withRetry<any>(() => gyazo.upload(imagePath), {
    maxRetries: 3,
    retryInterval: 1000
  });

  return isoGyazoImageId.wrap(res.data.image_id);
}

export async function getGyazoOCR(imageId: GyazoImageId) {
  const ocr = await fetchImage(imageId);
  return ocr.ocr?.description ?? '';
}

async function fetchImage(imageId: GyazoImageId): Promise<GyazoOCR> {
  const access_token = process.env['GYAZO_TOKEN'] as string;
  const data = await withRetry(
    async () => {
      const res = await fetch(
        `https://api.gyazo.com/api/images/${isoGyazoImageId.unwrap(
          imageId
        )}?access_token=${access_token}`
      );

      if (!res.ok) {
        throw new Error('Failed to fetch image');
      }

      return res.json();
    },
    {
      maxRetries: 3,
      retryInterval: 1000
    }
  );

  const r = GyazoOCR.decode(data);
  if (E.isLeft(r)) {
    console.log(data);
    console.log(PathReporter.report(r));
    throw new Error('Failed to decode GyazoOCR.');
  }

  return pipe(
    r,
    E.fold(
      (e: any) => {
        throw new Error(e);
      },
      v => v
    )
  );
}

// TODO: node.jsでfetchの型が提供されていない
declare global {
  function fetch(input: RequestInfo | URL): Promise<Response>;

  type RequestInfo = any;
  type Response = any;
}
