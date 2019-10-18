import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

import { ObjectValidator } from 'bsy-validation';

import { SearchQuery } from './search-query';

import { ValidationError } from 'bsy-error';

@Injectable()
export class ParseSearchQueryPipe implements PipeTransform<object, Promise<SearchQuery>> {
  /**
   * Transform an object--generally query parameters--to a SearchQuery object.
   */
  async transform(value: object, meta: ArgumentMetadata): Promise<SearchQuery> {
    if (typeof value !== 'object')
      throw new ValidationError('Invalid value type (search query must be an object).', meta.type);

    // Validate the value as a SearchQuery (it's decorated with validators).
    const validator = new ObjectValidator();

    await validator
      .validate(value, SearchQuery);

    // Outer structure is valid, so map to a SearchQuery.
    const search = new SearchQuery();

    if ((value as any).cond !== undefined)
      search.cond = JSON.parse((value as any).cond);
    if ((value as any).params !== undefined)
      search.params = JSON.parse((value as any).params);
    if ((value as any).order !== undefined)
      search.order = JSON.parse((value as any).order);
    if ((value as any).offset !== undefined)
      search.offset = parseInt((value as any).offset, 10);
    if ((value as any).rowCount !== undefined)
      search.rowCount = parseInt((value as any).rowCount, 10);

    return search;
  }
}
