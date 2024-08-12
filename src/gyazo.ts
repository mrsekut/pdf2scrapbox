import Gyazo from 'gyazo-api';
import { withRetry } from 'app/utils/utils.js';

import * as dotenv from 'dotenv';
import * as v from 'valibot';
dotenv.config();

export type GyazoImageId = v.Output<typeof GyazoImageId>;
const GyazoImageId = v.string(); // TODO: brand

const Ocr = v.union([
  v.object({ locale: v.unknown(), description: v.string() }),
  v.object({ locale: v.nullType(), description: v.literal('') }),
  v.undefinedType(),
]);

type GyazoOCR = v.Output<typeof GyazoOCR>;
const GyazoOCR = v.object({
  image_id: GyazoImageId,
  ocr: Ocr,
});

/**
 *
 * functions
 *
 */

export async function upload(imagePath: string): Promise<GyazoImageId> {
  const gyazo = new Gyazo(process.env['GYAZO_TOKEN']);

  // TODO: any
  const res = await withRetry<any>(() => gyazo.upload(imagePath), {
    maxRetries: 10,
    retryInterval: 1000,
  });

  return res.data.image_id;
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
        `https://api.gyazo.com/api/images/${imageId}?access_token=${access_token}`,
      );

      if (!res.ok) {
        throw new Error('Failed to fetch image');
      }

      return res.json();
    },
    {
      maxRetries: 10,
      retryInterval: 1000,
    },
  );

  try {
    return v.parse(GyazoOCR, data);
  } catch (e) {
    console.error(e);
    throw new Error('Failed to decode GyazoOCR.');
  }
}

// TODO: node.jsでfetchの型が提供されていない
declare global {
  function fetch(input: RequestInfo | URL): Promise<Response>;

  type RequestInfo = any;
  type Response = any;
}
