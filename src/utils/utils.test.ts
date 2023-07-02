import { describe, expect, test } from 'vitest';
import { chunk, pad, range } from './utils';

describe('range', () => {
  test('range', () => {
    expect(range(0)).toEqual([]);
    expect(range(5)).toEqual([0, 1, 2, 3, 4]);
    expect(range(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(range(3, 5)).toEqual([3, 4, 5]);
  });
});

describe('pad', () => {
  test('pad', () => {
    expect(pad(1)(2)).toEqual('2');
    expect(pad(2)(2)).toEqual('02');
    expect(pad(3)(2)).toEqual('002');
    expect(pad(3)(22)).toEqual('022');
    expect(pad(3)(222)).toEqual('222');

    expect(pad(0)(222)).toEqual('222');
    expect(pad(1)(222)).toEqual('222');
    expect(pad(2)(222)).toEqual('222');
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
