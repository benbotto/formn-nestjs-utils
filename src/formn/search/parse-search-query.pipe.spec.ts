import { ParseSearchQueryPipe } from './parse-search-query.pipe';

describe('ParseSearchQueryPipe()', () => {
  const pipe = new ParseSearchQueryPipe();

  describe('.transform()', () => {
    it('throws an error if the value is not an object.', async () => {
      try {
        await pipe.transform('asdf' as any, {type: 'query'});
        expect(true).toBe(false);
      }
      catch (err) {
        expect(err.message).toBe('Invalid value type (search query must be an object).');
      }
    });

    it('validates the search query object.', async () => {
      try {
        await pipe.transform({offset: null}, null);
        expect(true).toBe(false);
      }
      catch (err) {
        expect(err.errors[0].message).toBe('"offset" must not be null.');
      }
    });

    it('parses cond and params.', async () => {
      const cond   = JSON.stringify({$eq: {'name': ':name'}});
      const params = JSON.stringify({name: 'Jack'});

      const search = await pipe.transform({cond, params}, null);

      expect(typeof search.cond).toBe('object');
      expect(typeof search.params).toBe('object');
      expect(search.offset).not.toBeDefined();
      expect(search.rowCount).not.toBeDefined();
    });

    it('parses offset and rowCount as integers.', async () => {
      const search = await pipe.transform({offset: '1', rowCount: '10'}, null);

      expect(search.offset).toBe(1);
      expect(search.rowCount).toBe(10);
      expect(search.cond).not.toBeDefined();
      expect(search.params).not.toBeDefined();
    });
  });
});
