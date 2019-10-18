import { Validator, JSONValidator } from 'bsy-validation';
import { OrderByType } from 'formn';

export class OrderByTypeValidator implements Validator {
  /**
   * Makes sure that an object (or JSON string) can be parsed to an array of
   * OrderByType objects.
   */
  validate(val: any): boolean {
    let orders: OrderByType[];

    if (val === null || val === undefined)
      return true;

    // If a string is supplied, convert it to an array.
    if (typeof val === 'string') {
      if (!new JSONValidator().validate(val))
        return false;

      orders = JSON.parse(val) as OrderByType[];
    }
    else
      orders = val as OrderByType[];

    if (!Array.isArray(orders))
      return false;

    for (const order of orders) {
      // Each order must be an object of the form:
      // {property: string, dir: 'ASC' | 'DESC'}
      if (typeof order !== 'object')
        return false;

      if (typeof order['property'] !== 'string')
        return false;

      if (typeof order['dir'] !== 'string')
        return false;

      if (order['dir'] !== 'ASC' && order['dir'] !== 'DESC')
        return false;
    }

    return true;
  }

  /**
   * Error string.
   */
  getErrorMessage(prop: string): string {
    return `"${prop}" must be an OrderByType array ([{property: string, dir: 'ASC' | 'DESC'}]).`;
  }
}
