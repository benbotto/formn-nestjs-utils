import { Injectable, Scope } from '@nestjs/common';

import {
  MySQLDataContext, ConnectionOptions, MySQLExecuter, MySQLEscaper, EntityType,
  Insert, MySQLFromAdapter, TableType, MySQLUpdateModel, DeleteModel,
  MySQLTransactionalDataContext
} from 'formn';

import { DefaultDataContext } from './default-data-context';

/**
 * This class manages the application-wide DataContext instance.  It's request
 * scoped so that transactions can be safely used in a request.
 */
@Injectable({scope: Scope.REQUEST})
export class DataContextManager extends MySQLDataContext {
  private transDataContext: MySQLTransactionalDataContext = null;

  /**
   * Initialize with the singleton-scoped dc.
   * storage.
   */
  constructor(private defaultDataContext: DefaultDataContext) {
    super();
  }

  /**
   * Get the active DataContext instance (the default, or the transactional
   * one).
   */
  get dataContext(): MySQLDataContext {
    return this.transDataContext || this.defaultDataContext;
  }

  /**
   * Connect to the database.
   */
  connect(connOpts: ConnectionOptions): Promise<this> {
    throw new Error('connect not implemented.');
  }

  /**
   * End the connection.
   */
  end(): Promise<void> {
    this.transDataContext = null;
    return this.defaultDataContext.end();
  }

  /**
   * Begin a transaction, and store the transactional data context.
   */
  beginTransaction<R>(transFunc: (dc: MySQLTransactionalDataContext) => Promise<R>): Promise<R> {
    if (this.transDataContext !== null) {
      // Transaction already started.  Call the user-supplied function with the
      // existing transactional data context.
      return transFunc(this.transDataContext);
    }

    return this.dataContext
      .beginTransaction(async transDC => {
        // Store the transactional data context.  It will be returned in
        // subsequent dataContext accesses (set the getter above), and
        // therefore used by CRUD operations (below).
        this.transDataContext = transDC;

        try {
          // Resolve with the result of the user's function.
          const result: R = await transFunc(transDC);

          // Top-level transaction finished, so null the transDataContext.
          this.transDataContext = null;

          return result;
        }
        catch (err) {
          // If the user's function fails, roll back and re-throw.
          await this.rollbackTransaction();

          throw err;
        }
      });
  }

  /**
   * Rollback a transaction, and null the transactional datacontext.
   */
  rollbackTransaction(): Promise<void> {
    const rollbackRes = this.dataContext
      .rollbackTransaction();

    rollbackRes
      .finally(() => this.transDataContext = null);

    return rollbackRes;
  }

  /**
   * All of the below simply proxy calls to the current DC (default or
   * transactional).
   */
  getExecuter(): MySQLExecuter {
    return this.dataContext.getExecuter();
  }

  getEscaper(): MySQLEscaper {
    return this.dataContext.getEscaper();
  }

  insert<T>(Entity: EntityType<T>, model: T): Insert<T> {
    return this.dataContext.insert<T>(Entity, model);
  }

  from<T>(Entity: EntityType<T>, alias?: string): MySQLFromAdapter<T> {
    return this.dataContext.from<T>(Entity, alias);
  }

  update<T>(Entity: EntityType<T>, model: T): MySQLUpdateModel<T> {
    return this.dataContext.update<T>(Entity, model);
  }

  delete<T>(Entity: EntityType<T>, model: T): DeleteModel<T> {
    return this.dataContext.delete<T>(Entity, model);
  }
}

