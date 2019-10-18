import { OrderByTypeValidator } from './order-by-type.validator';

describe('OrderByTypeValidator()', () => {
  const val = new OrderByTypeValidator();

  describe('.validate()', () => {
    it('returns true if the value is null or undefined.', () => {
      expect(val.validate(null)).toBe(true);
      expect(val.validate(undefined)).toBe(true);
    });

    it('returns false if the value is not a JSON string or does not parse to an array.', () => {
      expect(val.validate('{"name":"jode"')).toBe(false);
      expect(val.validate('""')).toBe(false);
      expect(val.validate('{}')).toBe(false);
    });

    it('returns true if an array is supplied.', () => {
      expect(val.validate([])).toBe(true);
      expect(val.validate([{property: 'prop', dir: 'ASC'}])).toBe(true);
    });

    it('returns true if the JSON string can be parsed to an array of orders.', () => {
      expect(val.validate('[]')).toBe(true);
      expect(val.validate(JSON.stringify([{property: 'prop', dir: 'ASC'}]))).toBe(true);
    });

    it('returns false if the property is not a string.', () => {
      expect(val.validate([{property: [], dir: 'ASC'}])).toBe(false);
      expect(val.validate([{dir: 'ASC'}])).toBe(false);
    });

    it('returns false if the dir is not a string.', () => {
      expect(val.validate([{property: 'prop', dir: []}])).toBe(false);
      expect(val.validate([{property: 'prop'}])).toBe(false);
    });
  });

  describe('.getErrorMessage()', () => {
    it('returns an error message.', () => {
      expect(val.getErrorMessage('foo'))
        .toBe('"foo" must be an OrderByType array ([{property: string, dir: \'ASC\' | \'DESC\'}]).');
    });
  });
});
