import { ParameterTypeValidator } from './parameter-type-validator';

describe('ParameterTypeValidator()', () => {
  const val = new ParameterTypeValidator();

  describe('.validate()', () => {
    it('returns true if the value is null or undefined', () => {
      expect(val.validate(null)).toBe(true);
      expect(val.validate(undefined)).toBe(true);
    });

    it('returns false if the value is not a JSON string or does not parse to an object.', () => {
      expect(val.validate('{"name":"jode"')).toBe(false);
      expect(val.validate('""')).toBe(false);
    });

    it('returns false if an array is supplied.', () => {
      expect(val.validate([])).toBe(false);
    });

    it('returns true if all properties are primitive.', () => {
      const obj = {
        str: 'asdf',
        bool: false,
        bool2: true,
        nil: null as any,
        num: 42
      };

      expect(val.validate(obj)).toBe(true);
      expect(val.validate(JSON.stringify(obj))).toBe(true);
    });

    it('returns false if a property is not primitive.', () => {
      const obj = {
        arr: [] as any
      };

      expect(val.validate(obj)).toBe(false);
    });
  });

  describe('.getErrorMessage()', () => {
    it('returns an error message.', () => {
      expect(val.getErrorMessage('foo')).toBe('"foo" must be an object of primitives (Boolean, Number, String, or null values).');
    });
  });
});
