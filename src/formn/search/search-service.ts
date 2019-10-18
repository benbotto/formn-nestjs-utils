import {
  ParameterType, ColumnLookup, ConditionMapper, ParameterizedCondition,
  OrderByType
} from 'formn';

import { ValidationError } from 'bsy-error';

import { SearchDao } from './search-dao';
import { SearchResult } from './search-result';

export class SearchService<T extends object> {
  /**
   * Initialize with a SearchDao instance.
   * @param dao A data-access object for searching.
   */
  constructor(
    protected dao: SearchDao<T>,
    protected columnLookup: ColumnLookup) {
  }

  /**
   * Retrieve SearchResult record which has an array of Entity and some
   * metadata about the resources.  The cond and params are mapped using
   * a ColumnLookup instance.
   * @param offset Start row of the result set.
   * @param rowCount Number of rows to return.
   * @param cond An condition object condition that can be transpiled into a
   * SQL where clause.
   * @param parms Parameter replacements for the condition.
   * @param order How the results should be ordered.  If not provided, then
   * the result shall be ordered using the primary key column (ascending).
   */
  retrieve(offset: number = 0, rowCount: number = 10,
    cond?: object, params?: ParameterType,
    order?: OrderByType[]): Promise<SearchResult<T>> {

    cond  = this.mapCondition(cond, params);
    order = this.mapOrder(order);

    return this.dao
      .retrieve(offset, rowCount, cond as ParameterizedCondition, order);
  }

  /**
   * Map the properties of the search condition to fully-qualified property
   * names ("columns").  This raises a ValidationError if the condition doesn't
   * parse or if it's missing a parameter.
   * @param cond An condition object that can be transpiled into a SQL where
   * clause.
   * @param parms Parameter replacements for the condition.
   * @return A ParameterizedCondition instance with the columns remapped.
   */
  protected mapCondition(cond?: object,
    params: ParameterType = {}): ParameterizedCondition {

    if (!cond || !Object.keys(cond).length)
      return; // undefined condition (no condition).

    try {
      cond = new ConditionMapper()
        .map(cond, this.columnLookup, params);

      return ParameterizedCondition.normalize(cond, params);
    }
    catch (err) {
      throw new ValidationError(err.message, 'cond');
    }
  }

  /**
   * Map the properties of the order object to columns.
   * @param order An array of OrderByType.
   */
  protected mapOrder(orders: OrderByType[] = []): OrderByType[] {
    try {
      return orders
        .map(order => {
          return {
            property: this.columnLookup
              .getColumn(order.property),
            dir: order.dir,
          } as OrderByType;
        });
    }
    catch (err) {
      throw new ValidationError(err.message, 'order');
    }
  }
}
