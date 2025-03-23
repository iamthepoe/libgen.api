import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LibraryGenesisApi } from '../index.ts';
import * as cheerio from 'cheerio';
import ky from 'ky';

const mockHtml = `
<table class="c">
  <tr><td>ID</td><td>Author</td><td>Title</td><td>Publisher</td><td>Year</td><td>Pages</td><td>Language</td><td>Size</td><td>Ext</td><td><a href="mirror1">M1</a></td><td><a href="mirror2">M2</a></td><td><a href="edit">Edit</a></td></tr>
  <tr><td>123</td><td>Author Name</td><td>Book Title</td><td>Publisher Name</td><td>2022</td><td>100</td><td>en</td><td>5 MB</td><td>pdf</td><td><a href="mirror1">M1</a></td><td><a href="mirror2">M2</a></td><td><a href="edit">Edit</a></td></tr>
</table>
<a href="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf">GET</a>
`;

const mockHtmlClient = {
  load: (html: string) => cheerio.load(html),
} as typeof cheerio;

const mockHttpClient = {
  get: (_url: string, _opts?: any) => ({
    text: async () => mockHtml,
    arrayBuffer: async () =>
      new TextEncoder().encode('mock-pdf-content').buffer,
  }),
  create: () => mockHttpClient,
} as typeof ky;

const api = new LibraryGenesisApi(mockHtmlClient, mockHttpClient);

test('sanitizeQuery should return error for short query', () => {
  const result = api['sanitizeQuery']('a');
  assert.deepEqual(result, {
    data: null,
    error: 'Query too short',
  });
});

test('sanitizeQuery should accept a valid query', () => {
  const result = api['sanitizeQuery']('javascript');
  assert.deepEqual(result, {
    data: 'javascript',
    error: null,
  });
});

test('getDownloadLinkbyFirstMirrorHtml should return correct link', () => {
  const html = `<a href="http://example.com/file.pdf">GET</a>`;
  const result = api['getDownloadLinkbyFirstMirrorHtml'](html);
  assert.deepEqual(result, {
    data: 'http://example.com/file.pdf',
    error: null,
  });
});

test('getDownloadLinkbyFirstMirrorHtml should return error if link not found', () => {
  const html = `<a href="http://example.com">Download</a>`;
  const result = api['getDownloadLinkbyFirstMirrorHtml'](html);
  assert.deepEqual(result, {
    data: null,
    error: 'Download link not found',
  });
});

test('getQueryOptionsObject should return correct query object', () => {
  const result = api['getQueryOptionsObject']({
    resultsPerPage: 50,
    sort: { by: 'year', order: 'DESC' },
    searchBy: 'title',
    page: 2,
    phrase: true,
  });

  assert.deepEqual(result, {
    res: 50,
    sort: 'year',
    sortmode: 'DESC',
    column: 'title',
    page: 2,
    phrase: 1,
  });
});

test('parseBooksFromHtml should return parsed books array', () => {
  const books = api['parseBooksFromHtml'](mockHtml);
  assert.equal(books.length, 1);
  assert.equal(books[0].id, '123');
  assert.equal(books[0].title, 'Book Title');
  assert.equal(typeof books[0].download, 'function');
});

test('search should return books array for valid query', async () => {
  const result = await api.search('javascript');
  assert.equal(result.error, null);
  assert.ok(Array.isArray(result.data));
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].title, 'Book Title');
});

test('downloadBook should return Buffer', async () => {
  const book = (await api.search('javascript')).data![0];
  const download = await book.download();
  assert.equal(download.error, null);
  assert.ok(Buffer.isBuffer(download.data));
});
