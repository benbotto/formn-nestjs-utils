import { ParameterType, ParameterizedCondition } from 'formn';

import { Dao } from './dao';

/**
 * Base class for CRUD services.
 */
export class CRUDService<T extends object> {
  /**
   * Initialize with a Dao instance.
   * @param dao A data-access object.
   */
  constructor(
    protected dao: Dao<T>) {
  }

  /**
   * Insert a model.
   * @param model The model to insert.  If available in the response, model
   * will be updated with its inserted ID.
   */
  create(model: T): Promise<T> {
    return this.dao.create(model);
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
    return this.dao.retrieve(cond, params);
  }

  /**
   * Retrieve a single resource by ID.
   * @param id The identifier for the resource.  (Generic composite key
   * retrieval is not implemented.)
   */
  retrieveById(id: number | string | Date): Promise<T> {
    return this.dao.retrieveById(id);
  }

  /**
   * Update a model.
   * @param model An instance of type T to update by ID.
   */
  updateModel(model: T): Promise<T> {
    return this.dao.updateModel(model);
  }

  /**
   * Delete a model by ID.
   * @param model An instance of type T to delete by ID.
   */
  deleteById(id: number | string | Date): Promise<T> {
    return this.dao.deleteById(id);
  }
}
