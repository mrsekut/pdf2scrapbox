import { describe, expect, test } from 'vitest';
import { pad } from './utils.js';

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
