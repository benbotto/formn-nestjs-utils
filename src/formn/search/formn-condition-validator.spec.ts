import { FormnConditionValidator } from './formn-condition-validator';

describe('FormnConditionValidator()', () => {
  const val = new FormnConditionValidator();

  describe('.validate()', () => {
    it('returns true if the value is null or undefined.', () => {
      expect(val.validate(null)).toBe(true);
      expect(val.validate(undefined)).toBe(true);
    });

    it('returns true if the condition lexes and parses.', () => {
      expect(val.validate({$eq: {'foo': ':foo-param'}})).toBe(true);
    });

    it('returns false if the condition does not lex or parse.', () => {
      expect(val.validate({$bad: {'foo': ':foo-param'}})).toBe(false);
    });
  });

  describe('.getErrorMessage()', () => {
    it('returns an error message.', () => {
      expect(val.getErrorMessage('foo')).toBe('"foo" must be a valid Formn condition.');
    });
  });
});
