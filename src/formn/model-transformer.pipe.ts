import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

import { ModelTransformer } from 'formn';

import { ValidationError } from 'bsy-error';

@Injectable()
export class ModelTransformerPipe implements PipeTransform<any> {
  /**
   * Transform a value, which should be an object representation of a Formn
   * Entity, to an Entity instance.  This is useful as a parameter decorator
   * for controller methods to transform the body of a request.
   */
  async transform(value: any, meta: ArgumentMetadata): Promise<any> {
    // The transformer only transforms single Formn entities.
    if (typeof value !== 'object' || Array.isArray(value))
      throw new ValidationError('Invalid model type (must be an object).', meta.type);

    if (!meta.metatype) {
      console.error('value', value);
      console.error('meta', meta);

      throw new Error('Unknown metatype in ModelTransformerPipe.');
    }

    // Do the actual transformation.
    const transformer = new ModelTransformer();
    const ent = await transformer.transform(value, meta.metatype);

    return ent;
  }
}
