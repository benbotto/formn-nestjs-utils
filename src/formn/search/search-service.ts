import { ParameterType, ColumnLookup, ConditionMapper } from 'formn';

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
   * @param cond An condition object that can be transpiled into a SQL where
   * clause.
   * @param parms Parameter replacements for the condition.
   */
  retrieve(offset: number, rowCount: number,
    cond?: object, params: ParameterType = {}): Promise<SearchResult<T>> {

    cond = this.mapCondition(cond, params);

    return this.dao
      .retrieve(offset, rowCount, cond, params);
  }

  /**
   * Map the properties of the search condition to fully-qualified property
   * names ("columns").  This raises a ValidationError if the condition doesn't
   * parse or if it's missing a parameter.
   * @param cond An condition object that can be transpiled into a SQL where
   * clause.
   * @param parms Parameter replacements for the condition.
   */
  protected mapCondition(cond?: object, params: ParameterType = {}): object {
    if (!cond || !Object.keys(cond).length)
      return cond;

    try {
      return new ConditionMapper()
        .map(cond, this.columnLookup, params);
    }
    catch (err) {
      throw new ValidationError(err.message, 'cond');
    }
  }
}
