import { Validator } from 'bsy-validation';

import { ConditionLexer, ConditionParser } from 'formn';

export class FormnConditionValidator implements Validator {
  /**
   * Lex and parse the condition.  It can be either a string or an object.  If
   * it fails to lex/parse, it's invalid.
   */
  validate(val: string | object): boolean {
    if (val === null || val === undefined)
      return true;

    try {
      const lexer  = new ConditionLexer();
      const parser = new ConditionParser();

      // If it lexes and parses, it's a valid condition object.
      parser.parse(
        lexer.parse(val));

      return true;
    }
    catch (err) {
      return false;
    }
  }

  /**
   * Error string.
   */
  getErrorMessage(prop: string): string {
    return `"${prop}" must be a valid Formn condition.`;
  }
}
