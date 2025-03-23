
<p align=center>
    <img src="https://libgenesis.net/images/libgen-logo.webp"/>
</p>

# Library Genesis API (Node.js)

A lightweight Node.js client for querying and downloading books from Library Genesis.

This library allows you to:

-   Search books using different filters.
-   Access metadata such as author, title, language, extension, and more.
-   Download files directly from mirror links.

> ⚠️ Please use ethically. Do not abuse the Library Genesis servers.

----------

## Table of Contents

-   [Installation](#installation)
-   [Basic Usage](#basic-usage)
    -   [Searching by Title](#searching-by-title)
    -   [Searching by Author](#searching-by-author)
-   [Advanced Searching](#advanced-searching)
    -   [Using QueryOptions](#using-queryoptions)
    -   [Sorting and Pagination](#sorting-and-pagination)
-   [Handling Results](#handling-results)
    -   [Book Object Structure](#book-object-structure)
    -   [Downloading Files](#downloading-files)
-   [Error Handling](#error-handling)
-   [Testing](#testing)
-   [License](#license)
-   [Disclaimer](#disclaimer)

----------

## Installation

```bash
npm install library-genesis-api

```

Or with Yarn:

```bash
yarn add library-genesis-api

```

----------

## Basic Usage

### Importing and Instantiating

```ts
import { LibraryGenesisApi } from "library-genesis-api";

const api = new LibraryGenesisApi();

```

----------

### Searching by Title

```ts
const result = await api.search("Clean Code");

if (result.error) {
  console.error("Search error:", result.error);
} else {
  console.log("Found books:", result.data);
}

```

----------

### Searching by Author

```ts
const result = await api.search("Robert C. Martin", {
  searchBy: "author"
});

result.data?.forEach(book => {
  console.log(book.title, "-", book.year);
});

```

----------

## Advanced Searching

### Using `QueryOptions`

You can customize search behavior with additional options.

```ts
const options = {
  searchBy: "title",
  sort: { by: "year", order: "DESC" },
  phrase: true,
  resultsPerPage: 50,
  page: 2
};

const result = await api.search("JavaScript", options);

```

----------

### Sorting and Pagination

```ts
// Sort by file size, descending
const result = await api.search("Python", {
  sort: { by: "filesize", order: "DESC" }
});

// Fetch page 3 of the results
const result = await api.search("Agile", {
  page: 3
});

```

----------

## Handling Results

### Book Object Structure

Each result returned from `.search()` has the following structure:

```ts
type Book = {
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
  download: () => Promise<{ data: Buffer | null; error: string | null }>;
};

```

----------

### Downloading Files

You can download a file buffer directly using the `download()` method:

```ts
const result = await api.search("Design Patterns");

const book = result.data?.[0];

if (book) {
  const file = await book.download();

  if (file.error) {
    console.error("Download failed:", file.error);
  } else {
    console.log("Downloaded file size:", file.data.length);
  }
}

```

> You can write the file to disk using `fs.writeFileSync()` if needed.

```ts
import fs from "fs";

fs.writeFileSync("book.pdf", file.data);

```

----------

## Error Handling

All public methods return an object of the form:

```ts
type LibraryGenesisResponse<T> = {
  data: T | null;
  error: string | null;
};

```

Always check for `error` before using the `data`.

```ts
const result = await api.search("short");

if (result.error) {
  console.log("Error:", result.error);
} else {
  console.log(result.data);
}

```

----------

## Testing

Tests are written using Node.js native test runner.

To run the test suite:

```bash
node --test

```

Tests are located in the `/lib/__test__/` directory and cover:

-   Query sanitization
-   Download resolution
-   Parsing logic
-   Error responses

----------

## ToDo:

 - [ ] Method to view book details
 - [ ] Add more download options through other mirrors
 - [ ] Add book cover information to objects
 - [ ] Filter system
 
 And anything else relevant that appears in an issue.

## License

This project is **unlicensed**. You may use, copy, modify, and distribute it freely, without any restriction.

----------

## Disclaimer

This project is not affiliated with or endorsed by Library Genesis.

It is intended for educational, archival, and research purposes only.

**Please do not abuse the Library Genesis service.**

-   Do not scrape or download excessively.
-   Respect server load and bandwidth.
-   Help preserve access for others.
