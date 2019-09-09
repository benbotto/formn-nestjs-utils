import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

import { ModelTransformer, EntityType } from 'formn';

import { ValidationError } from 'bsy-error';

@Injectable()
export class ModelArrayTransformerPipe<T> implements PipeTransform<T[]> {
  constructor(private entityType: EntityType<T>) {
  }

  /**
   * Transform a value, which should be an array of Formn Entity, an array of
   * Entity instances.  This is useful as a decorator for controller methods to
   * transform the body of a request.
   */
  async transform(rawEnts: any, meta: ArgumentMetadata): Promise<any> {
    const ents: T[] = [];

    if (!Array.isArray(rawEnts))
      throw new ValidationError('Invalid model type (must be an array).', meta.type);

    const transformer = new ModelTransformer();

    for (const rawEnt of rawEnts) {
      const ent = await transformer.transform(rawEnt, this.entityType);

      ents.push(ent);
    }

    return ents;
  }
}

