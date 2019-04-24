import { Module, Global, DynamicModule } from '@nestjs/common';

import { ConnectionOptions } from 'formn';

import { DefaultDataContext } from './default-data-context';
import { DataContextManager } from './data-context-manager';
import { ModelTransformerPipe } from './model-transformer.pipe';
import { Dao } from './dao';

@Global()
@Module({})
export class FormnModule {
  static async forRoot(connOpts: ConnectionOptions): Promise<DynamicModule> {
    // Connect the single-instance MySQLDatacontext instance.  This isn't
    // exported, rather it's managed by the DataContextManager.  The manager is
    // request scoped so that transactions can be used for the entirety of a
    // request.
    const dc = await new DefaultDataContext()
      .connect(connOpts);

    const dcProvider = {
      provide:  DefaultDataContext,
      useValue: dc
    };

    return {
      module: FormnModule,
      providers: [
        dcProvider,
        DataContextManager,
        ModelTransformerPipe,
        Dao
      ],
      exports: [
        DataContextManager,
        ModelTransformerPipe,
        Dao
      ],
    };
  }
}

