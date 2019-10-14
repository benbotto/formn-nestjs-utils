import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

import { ValidationError } from 'bsy-error';

@Injectable()
export class ParseJSONPipe implements PipeTransform<any> {
  /**
   * Transform a string value from JSON or raise a ValidationError.
   */
  transform(value: string, meta: ArgumentMetadata): any {
    // The transformer only transforms single Formn entities.
    if (typeof value !== 'string')
      throw new ValidationError(`Invalid value type ("${meta.data}" must be a string).`, meta.type);

    try {
      return JSON.parse(value);
    }
    catch (err) {
      throw new ValidationError(`"${meta.data}" must contain valid JSON.`, meta.type);
    }
  }
}
