import {
  DataContext, EntityType, ParameterType, ParameterizedCondition, OrderByType,
  metaFactory
} from 'formn';

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
    protected alias: string) {
  }

  /**
   * Retrieve a SearchResult record which has an array of Entity and some
   * metadata about the resources.
   * @param offset Start row of the result set.
   * @param rowCount Number of rows to return.
   * @param cond A ParameterizedCondition (search filters).
   * @param order How the results should be ordered.  If not provided, then
   * the result shall be ordered using the primary key column (ascending).
   */
  retrieve(offset: number, rowCount: number,
    cond?: ParameterizedCondition,
    order?: OrderByType[]): Promise<SearchResult<T>> {

    // Order defaults to pk(s) ascending.
    if (!order || !order.length) {
      const pks = metaFactory
        .getColumnStore()
        .getPrimaryKey(this.Entity);

      order = pks
        .map(pk => {
          return {
            property: `${this.alias}.${pk.mapTo}`,
            dir: 'ASC'
          } as OrderByType;
        });
    }

    return this.dataContext.beginTransaction(async () => {
      const query = this.dataContext
        .from<T>(this.Entity, this.alias);

      if (cond)
        query.where(cond)

      // Count of entities matching the filter.
      const qCount = query
        .count()
        .execute();

      // List of entities.
      const qEntities = query
        .select()
        .orderBy(...order)
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
      result.order    = order;

      return result;
    });
  }
}
