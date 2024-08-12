import { range } from '@mrsekut/utils';

export { range };

export const pad = (keta: number) => (num: number) => {
  return num.toString().padStart(keta, '0');
};

export function sleep(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    retryInterval: number;
  },
): Promise<T> => {
  return attempt(options.maxRetries);

  async function attempt(retriesLeft: number): Promise<T> {
    if (retriesLeft === 0) {
      throw new Error(`Failed to fetch after ${options.maxRetries} retries.`);
    }

    try {
      return await fn();
    } catch (error) {
      console.error(`Error fetching. Retrying...`);
      await sleep(options.retryInterval);
      return attempt(retriesLeft - 1);
    }
  }
};
