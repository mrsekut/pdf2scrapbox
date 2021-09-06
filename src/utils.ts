export function range(n1: number, n2?: number) {
  if (n2 == null) {
    return [...new Array(n1).keys()];
  }

  const start = n1;
  const end = n2;
  return [...Array(end - start + 1)].map((_, i) => start + i);
}