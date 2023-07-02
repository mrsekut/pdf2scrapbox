import { describe, expect, test } from 'vitest';
import { chunk, range } from './utils';

describe('range', () => {
  test('range', () => {
    expect(range(0)).toEqual([]);
    expect(range(5)).toEqual([0, 1, 2, 3, 4]);
    expect(range(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(range(3, 5)).toEqual([3, 4, 5]);
  });
});

describe('chunks', () => {
  test('chunk', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(chunk(array, 1)).toEqual([[1], [2], [3], [4], [5], [6], [7], [8]]);
    expect(chunk(array, 3)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8]
    ]);
    expect(chunk(array, 5)).toEqual([
      [1, 2, 3, 4, 5],
      [6, 7, 8]
    ]);
  });
});
