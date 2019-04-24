import { Injectable } from '@nestjs/common';

import { MySQLDataContext } from 'formn';

/**
 * The default, singleton data context.  This is what's connected to the
 * database, and it's managed by the DataContextManager.
 */
@Injectable()
export class DefaultDataContext extends MySQLDataContext {
}

