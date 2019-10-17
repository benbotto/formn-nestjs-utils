import { Validator, JSONObjectValidator } from 'bsy-validation';
import { ParameterType } from 'formn';

export class ParameterTypeValidator implements Validator {
  /**
   * Makes sure that an object (or JSON string) only contains Boolean, null,
   * Number, or String types.
   */
  validate(val: ParameterType | string): boolean {
    let obj: ParameterType;

    if (val === null || val === undefined)
      return true;

    // If a string is supplied, convert it to an object.
    if (typeof val === 'string') {
      if (!new JSONObjectValidator().validate(val))
        return false;

      obj = JSON.parse(val) as ParameterType;
    }
    else {
      obj = val as ParameterType;

      if (typeof obj !== 'object' || Array.isArray(obj))
        return false;
    }

    for (const key in obj) {
      const type = typeof obj[key];

      if (type !== 'boolean' && type !== 'string' && type !== 'number' && obj[key] !== null)
        return false;
    }

    return true;
  }

  /**
   * Error string.
   */
  getErrorMessage(prop: string): string {
    return `"${prop}" must be an object of primitives (Boolean, Number, String, or null values).`;
  }
}
