export class SearchResult<T extends object> {
  count: number;
  offset: number;
  rowCount: number;
  entities: T[];
}
