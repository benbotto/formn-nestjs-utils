import { DataContext, EntityType, ParameterType, ParameterizedCondition } from 'formn';

import { SearchResult } from './search-result';

export class SearchDao<T extends object> {
  /**
   * Initialize with a DataContext instance.
   * @param dataContext A DataContext instance for CRUD operations.
   * @param Entity The constructor of a Table-decorated class.
   * @param alias An optional alias for the entity, used when filtering.
   */
  constructor(
    protected dataContext: DataContext,
    protected Entity: EntityType<T>,
    protected alias?: string) {
  }

  /**
   * Retrieve a SearchResult record which has an array of Entity and some
   * metadata about the resources.
   * @param offset Start row of the result set.
   * @param rowCount Number of rows to return.
   * @param cond Either a condition object or a ParameterizedCondition.
   * clause.
   * @param parms Parameter replacements for the condition.
   */
  retrieve(offset: number, rowCount: number,
    cond?: object, params?: ParameterType): Promise<SearchResult<T>>;

  retrieve(offset: number, rowCount: number,
    cond: ParameterizedCondition): Promise<SearchResult<T>>;

  retrieve(offset: number, rowCount: number,
    cond?: object | ParameterizedCondition,
    params: ParameterType = {}): Promise<SearchResult<T>> {

    if (cond instanceof ParameterizedCondition) {
      params = cond.getParams();
      cond   = cond.getCond();
    }

    return this.dataContext.beginTransaction(async () => {
      const query = this.dataContext
        .from<T>(this.Entity, this.alias);

      if (cond && Object.keys(cond).length)
        query.where(cond, params);

      // Count of entities matching the filter.
      const qCount = query
        .count()
        .execute();

      // List of entities.
      const qEntities = query
        .select()
        .limit(offset, rowCount)
        .execute();

      const [count, entities] = await Promise
        .all([qCount, qEntities]);

      // Search results.  Note that the number of rows returned (rowCount) may
      // be fewer than the number requested.
      const result = new SearchResult<T>();

      result.count    = count;
      result.rowCount = entities.length;
      result.offset   = offset;
      result.entities = entities;

      return result;
    });
  }
}
