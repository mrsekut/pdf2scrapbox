export function range(n1: number, n2?: number) {
  if (n2 == null) {
    return [...new Array(n1).keys()];
  }

  const start = n1;
  const end = n2;
  return [...Array(end - start + 1)].map((_, i) => start + i);
}

export function chunk<T>(array: T[], size = 1): T[][] {
  return array.reduce(
    (acc: T[][], _, i) => (i % size ? acc : [...acc, array.slice(i, i + size)]),
    []
  );
}

export function sleep(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
