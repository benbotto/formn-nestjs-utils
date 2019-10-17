import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

import { ConditionLexer, ConditionParser } from 'formn';

import { ValidationError } from 'bsy-error';

@Injectable()
export class ParseConditionPipe implements PipeTransform<string, object> {
  /**
   * Transform a string value to an object, but lex and parse it as a Formn
   * condition.
   */
  transform(value: string, meta: ArgumentMetadata): object {
    if (typeof value !== 'string')
      throw new ValidationError(`Invalid value type ("${meta.data}" must be a string).`, meta.type);

    try {
      const lexer  = new ConditionLexer();
      const parser = new ConditionParser();

      // If it lexes and parses, it's a valid condition object.
      parser.parse(
        lexer.parse(value));

      return JSON.parse(value);
    }
    catch (err) {
      throw new ValidationError(`"${meta.data}" must contain be a valid Formn condition: ${err.message}`, meta.type);
    }
  }
}
