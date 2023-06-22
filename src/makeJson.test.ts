import { describe, expect, test } from 'vitest';
import { pageNum, validate } from './makeJson';

describe('pageNum', () => {
  test('first page', () => {
    expect(pageNum(0, 10, 3)).toMatchObject({
      prev: '000',
      next: '001'
    });
  });

  test('pages', () => {
    expect(pageNum(1, 10, 3)).toMatchObject({
      prev: '000',
      next: '002'
    });
  });

  test('last page', () => {
    expect(pageNum(10, 10, 3)).toMatchObject({
      prev: '009',
      next: '011'
    });
  });
});

describe('validate', () => {
  test('validate', () => {
    const pages = [
      { start: 0, end: 150 },
      { start: 151, end: 300 },
      { start: 301, end: 450 },
      { start: 451, end: 600 }
    ];
    expect(validate(pages)).toEqual(true);
  });

  test('validate', () => {
    const pages = [
      { start: 0, end: 151 },
      { start: 151, end: 300 }
    ];
    expect(validate(pages)).toEqual(false);
  });

  test('validate', () => {
    const pages = [
      { start: 0, end: 149 },
      { start: 151, end: 300 }
    ];
    expect(validate(pages)).toEqual(false);
  });
});
