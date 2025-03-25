export type Success<T> = { data: T; error: null };
export type Failure = { data: null; error: string };
export type LibraryGenesisResponse<T> = Success<T> | Failure;

export type Book = {
  id: string;
  authors: string;
  title: string;
  publisher: string;
  year: string;
  pages: string;
  language: string;
  size: string;
  extension: string;
  mirrors: string[];
  edit?: string;
  download: () => Promise<LibraryGenesisResponse<Buffer>>;
  getDetails: ()=> Promise<LibraryGenesisResponse<BookDetails>>;
};

export type BookDetails = {
  coverUrl: string;
  description: string;
  hashes: Array<{ identifier: string; hash: string }>;
  city: string;
  edition: string;
  timeModified: string;
  timeAdded: string;
  isbn: string;
}

export type QueryOptions = {
  resultsPerPage?: 25 | 50 | 100;
  sort?: {
    by:
      | 'year'
      | 'title'
      | 'publisher'
      | 'author'
      | 'pages'
      | 'language'
      | 'filesize'
      | 'extension';
    order: 'ASC' | 'DESC';
  };
  searchBy?:
    | 'title'
    | 'author'
    | 'series'
    | 'publisher'
    | 'year'
    | 'identifier'
    | 'language'
    | 'md5'
    | 'tags';
  phrase?: boolean;
  page?: number;
};
