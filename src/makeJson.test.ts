import { pageNum, validate } from 'app/makeJson';

describe('pageNum', () => {
  it('first page', () => {
    expect(pageNum(0, 10, 3)).toMatchObject({
      prev: '000',
      next: '001'
    });
  });

  it('pages', () => {
    expect(pageNum(1, 10, 3)).toMatchObject({
      prev: '000',
      next: '002'
    });
  });

  it('last page', () => {
    expect(pageNum(10, 10, 3)).toMatchObject({
      prev: '009',
      next: '011'
    });
  });
});

describe('validate', () => {
  it('validate', () => {
    const pages = [
      { start: 0, end: 150 },
      { start: 151, end: 300 },
      { start: 301, end: 450 },
      { start: 451, end: 600 }
    ];
    expect(validate(pages)).toEqual(true);
  });

  it('validate', () => {
    const pages = [
      { start: 0, end: 151 },
      { start: 151, end: 300 }
    ];
    expect(validate(pages)).toEqual(false);
  });

  it('validate', () => {
    const pages = [
      { start: 0, end: 149 },
      { start: 151, end: 300 }
    ];
    expect(validate(pages)).toEqual(false);
  });
});
