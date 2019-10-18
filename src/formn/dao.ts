import {
  DataContext, ParameterType, ParameterizedCondition, Select, EntityType,
  FromAdapter, InsertModelValidator, metaFactory, ConditionBuilder,
  DeleteModelValidator, UpdateModelValidator, MutateResultType, Delete
} from 'formn';

import { NotFoundError, DuplicateError } from 'bsy-error';

/**
 * A generic data-access object for Formn.
 */
export class Dao<T extends object> {
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
   * Insert a model.
   * @param model The model to insert.  If available in the response, model
   * will be updated with its inserted ID.
   */
  async create(model: T): Promise<T> {
    await new InsertModelValidator()
      .validate(model, this.Entity);

    try {
      return await this.dataContext
        .insert(this.Entity, model)
        .execute();
    }
    catch (err) {
      if (err.message.startsWith('Cannot add or update a child row: a foreign key constraint fails')) {
        const table = err.message.replace(/^.*REFERENCES `(\w+)`.*$/, '$1');

        throw new NotFoundError(`Failed to create "${this.Entity.name}."  Invalid reference to "${table}."`);
      }

      throw err;
    }
  }

  /**
   * Retrieve an array of resources of type T with optional filters.
   * @param cond An condition object that can be transpiled into a SQL where
   * clause.
   * @param parms Parameter replacements for the condition.
   */
  retrieve(cond?: object, params?: ParameterType): Promise<T[]>;

  /**
   * Retrieve an array of resources of type T with optional filters.
   * @param cond A ParameterizedCondition object built with a ConditionBuilder.
   */
  retrieve(cond: ParameterizedCondition): Promise<T[]>;

  /**
   * Retrieve an array of resources of type T with optional filters.
   */
  retrieve(cond: object | ParameterizedCondition, params?: ParameterType): Promise<T[]> {
    if (cond instanceof ParameterizedCondition) {
      params = cond.getParams();
      cond   = cond.getCond();
    }

    const query: FromAdapter<T> = this.dataContext
      .from(this.Entity, this.alias);

    if (cond && Object.keys(cond).length)
      query.where(cond, params);

    const select: Select<T> = query.select();

    return select.execute();
  }

  /**
   * Retrieve a single resource by ID.
   * @param id The identifier for the resource.  (Generic composite key
   * retrieval is not implemented.)
   */
  async retrieveById(id: number | string | Date): Promise<T> {
    const pk = metaFactory
      .getColumnStore()
      .getPrimaryKey(this.Entity);

    if (pk.length !== 1)
      throw new Error('Dao.retrieveById does not support composite primary keys.');

    // A DeleteModelValidator is used for validation here.  It checks the PK
    // and nothing else.
    await new DeleteModelValidator()
      .validate({[pk[0].mapTo]: id}, this.Entity);

    const cond = new ConditionBuilder()
      .eq(`${this.alias}.${pk[0].mapTo}`, `:${pk[0].mapTo}`, id);

    const resources = await this.retrieve(cond);

    if (resources.length === 0) {
      throw new NotFoundError(`"${pk[0].Entity.name}" not found using id "${id}."`);
    }
    else if (resources.length === 1)
      return resources[0];
    else {
      throw new DuplicateError(
        `Multiple "${pk[0].Entity.name}" resources found matching id "${id}."`,
        'id', id);
    }
  }

  /**
   * Update a model.
   * @param model An instance of type T to update by ID.
   */
  async updateModel(model: T): Promise<T> {
    await new UpdateModelValidator()
      .validate(model, this.Entity);

    try {
      return await this.dataContext
        .update(this.Entity, model)
        .execute();
    }
    catch (err) {
      if (err.message && err.message === 'Update operation did not affect any rows.') {
        throw new NotFoundError(`"${this.Entity.name}" not found.`);
      }
      else if (err.message.startsWith('Cannot add or update a child row: a foreign key constraint fails')) {
        const table = err.message.replace(/^.*REFERENCES `(\w+)`.*$/, '$1');

        throw new NotFoundError(`Failed to update "${this.Entity.name}."  Invalid reference to "${table}."`);
      }

      throw err;
    }
  }

  /**
   * Delete a model by ID.
   * @param model An instance of type T to delete by ID.
   */
  async deleteById(id: number | string | Date): Promise<T> {
    const pk = metaFactory
      .getColumnStore()
      .getPrimaryKey(this.Entity);

    if (pk.length !== 1)
      throw new Error('Dao.deleteById does not support composite primary keys.');

    const model = {[pk[0].mapTo]: id};

    await new DeleteModelValidator()
      .validate(model, this.Entity);

    try {
      return await this.dataContext
        .delete(this.Entity, model as T)
        .execute();
    }
    catch (err) {
      if (err.message && err.message === 'Delete operation did not affect any rows.')
        throw new NotFoundError(`"${this.Entity.name}" not found.`);

      throw err;
    }
  }

  /**
   * Delete from a table using condition and parameter objects.
   * @param cond An condition object that can be transpiled into a SQL where
   * clause.
   * @param parms Parameter replacements for the condition.
   */
  delete(cond?: object, params?: ParameterType): Promise<MutateResultType>;

  /**
   * Delete from a table using a ParameterizedCondition instance.
   * @param cond A ParameterizedCondition object built with a ConditionBuilder.
   */
  delete(cond: ParameterizedCondition): Promise<MutateResultType>;

  /**
   * Delete from a table with optional filters.
   */
  delete(cond: object | ParameterizedCondition, params?: ParameterType): Promise<MutateResultType> {
    if (cond instanceof ParameterizedCondition) {
      params = cond.getParams();
      cond   = cond.getCond();
    }

    const query: FromAdapter<T> = this.dataContext
      .from(this.Entity, this.alias);

    if (cond && Object.keys(cond).length)
      query.where(cond, params);

    const del: Delete = query.delete();

    return del.execute();
  }
}

