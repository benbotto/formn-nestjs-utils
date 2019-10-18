import { OrderByType } from 'formn';

export class SearchResult<T extends object> {
  count: number;
  offset: number;
  rowCount: number;
  entities: T[];
  order: OrderByType[];
}
