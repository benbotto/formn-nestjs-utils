import {
  DataContext, EntityType, ParameterType, ParameterizedCondition, OrderByType,
  metaFactory, ColumnMetadata, ConditionBuilder, FromAdapter
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
   * Get a FromAdapter instance (an Query that can be select()'d and
   * count()'d).  It should not include the where clause.
   */
  getSearchQuery(): FromAdapter<T> {
    return this.dataContext
      .from<T>(this.Entity, this.alias);
  }

  /**
   * Get the single unique identifier for the base table.  This is only needed
   * if multiple tables are joined, in which case there needs to be a way of
   * uniquely identifying top-level entities that match the search criteria.
   * The return value should be the property name only (e.g. "id" of "email").
   */
  getUniqueIdentifier(): string {
    const pks = metaFactory
      .getColumnStore()
      .getPrimaryKey(this.Entity);

    if (pks.length !== 1) {
      throw new Error(
        `A unique identifier cannot be derived for "${this.Entity.name}" ` +
        'because it uses a composite primary key.');
    }

    return pks[0].mapTo;
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
            property: ColumnMetadata.createFQName(this.alias, pk.mapTo),
            dir: 'ASC'
          } as OrderByType;
        });
    }

    return this.dataContext.beginTransaction(async () => {
      const countQuery = this.getSearchQuery();
      const uniqueId   = this.getUniqueIdentifier();
      const fqUniqueId = ColumnMetadata.createFQName(this.alias, uniqueId);

      if (cond)
        countQuery.where(cond);

      // Count of top-level entities matching the filter.
      const qCount = countQuery
        .countDistinct(fqUniqueId)
        .execute();

      // Distinct top-level IDs matching the filter.
      const qIDs = countQuery
        .selectDistinct(fqUniqueId)
        .orderBy(...order)
        .limit(offset, rowCount)
        .execute();

      const [count, distinctEnts] = await Promise
        .all([qCount, qIDs]);

      // List of entities (pulled by ID).
      const cb = new ConditionBuilder();
      const ids = distinctEnts
        .map(ent => (ent as ParameterType)[uniqueId]);
      let idCond = cb
        .in(fqUniqueId, ':search-distinct-ids', ids);

      // The original filter is still needed because it may filter out
      // child entities.
      if (cond)
        idCond = cb.and(idCond, cond);

      // A new condition is used, so getSearchQuery is called again.
      const entities = await this
        .getSearchQuery()
        .where(idCond)
        .select()
        .orderBy(...order)
        .limit(offset, rowCount)
        .execute();

      // Search results.  Note that the number of rows returned (rowCount) may
      // be fewer than the number requested.
      const result    = new SearchResult<T>();

      result.count    = count;
      result.rowCount = entities.length;
      result.offset   = offset;
      result.entities = entities;
      result.order    = order;

      return result;
    });
  }
}
