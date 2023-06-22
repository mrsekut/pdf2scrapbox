import { chunk, pad, range } from 'app/utils/utils';

describe('range', () => {
  test('range', () => {
    expect(range(0)).toEqual([]);
    expect(range(5)).toEqual([0, 1, 2, 3, 4]);
    expect(range(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(range(3, 5)).toEqual([3, 4, 5]);
  });
});

describe('pad', () => {
  it('pad', () => {
    expect(pad(2, 1)).toEqual('2');
    expect(pad(2, 2)).toEqual('02');
    expect(pad(2, 3)).toEqual('002');
    expect(pad(22, 3)).toEqual('022');
    expect(pad(222, 3)).toEqual('222');

    expect(pad(222, 0)).toEqual('222');
    expect(pad(222, 1)).toEqual('222');
    expect(pad(222, 2)).toEqual('222');
  });
});

describe('chunks', () => {
  it('chunk', () => {
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
