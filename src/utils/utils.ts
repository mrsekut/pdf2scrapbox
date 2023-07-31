export function range(n1: number, n2?: number) {
  if (n2 == null) {
    return [...new Array(n1).keys()];
  }

  const start = n1;
  const end = n2;
  return [...Array(end - start + 1)].map((_, i) => start + i);
}

export const pad = (keta: number) => (num: number) => {
  return num.toString().padStart(keta, '0');
};

export function chunk<T>(array: T[], size = 1): T[][] {
  return array.reduce(
    (acc: T[][], _, i) => (i % size ? acc : [...acc, array.slice(i, i + size)]),
    []
  );
}

export function sleep(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    retryInterval: number;
  }
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
