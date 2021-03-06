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

    /**
     * TODO: The retrieval of IDs is pretty inefficient because it might pull a
     * massive number of records.  It might be better to pull chunks (e.g. 100
     * records at a time) until rowCount is reached.  Further a user-supplied
     * startAt hint could be supplied (e.g. start at id 5,000 on page 50).
     *
     * There might need to be a filter provided on the entity retrieval.  It pulls
     * all the entities by id in totality, but it could be necessary to filter out
     * some of the sub-entities (e.g. people with only active phone numbers).  Right
     * now that's handled by join conditions, but it might not always be possible.
     */

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
      const uniqueId   = this.getUniqueIdentifier();
      const fqUniqueId = ColumnMetadata.createFQName(this.alias, uniqueId);

      // These are all the top-level IDs matching the search criteria.  (Formn
      // will make them distinct.)  A distinct list cannot be pulled and
      // limited because functional dependence.  The results may need to be
      // ordered by a column in a joined-in table.  See
      // https://dev.mysql.com/doc/refman/5.7/en/group-by-handling.html, and
      // particularly the note about ONLY_FULL_GROUP_BY and nondeterministic
      // results.
      const idQuery = this.getSearchQuery();

      if (cond)
        idQuery.where(cond);

      const distinctEnts = await idQuery
        .select(fqUniqueId)
        .orderBy(...order)
        .execute();

      // This is the returned SearchResult object.
      const result = new SearchResult<T>();

      result.count  = distinctEnts.length;
      result.offset = offset;
      result.order  = order;

      if (result.count && result.count > offset) {
        // A page of the top-level IDs.
        const ids = distinctEnts
          .slice(offset, offset + rowCount)
          .map(ent => (ent as ParameterType)[uniqueId]);

        const cb = new ConditionBuilder();
        const idCond = cb
          .in(fqUniqueId, ':search-distinct-ids', ids);

        // A new condition is used.  Note that the user-supplied condition is
        // not included here.  That condition could filter out child records
        // (e.g. if a Person has three PhoneNumbers, a search could match just
        // one PhoneNumber).  Here the matching records are returned in their
        // entirety (e.g. the Person with all three PhoneNumbers).
        const entities = await this
          .getSearchQuery()
          .where(idCond)
          .select()
          .orderBy(...order)
          .execute();

        // Note that rowCount may be smaller than requested.  The user may, for
        // example, request 5 records but only one may match the search
        // criteria.
        result.rowCount = entities.length;
        result.entities = entities;
      }
      else {
        // The count is 0, so no records match the search.
        result.rowCount = 0;
        result.entities = [];
      }

      return result;
    });
  }
}
