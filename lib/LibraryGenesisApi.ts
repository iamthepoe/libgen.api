import * as cheerio from "cheerio";
import ky from "ky";
import type { KyInstance } from "ky";

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
}

type QueryOptions = {
    resultsPerPage?: 25 | 50 | 100;
    sort?: {
        by: "year" | "title" | "publisher" | "author" | "pages" | "language" | "filesize" | "extension";
        order: "ASC" | "DESC";
    };
    searchBy?: "title" | "author" | "series" | "publisher" | "year" | "identifier" | "language" | "md5" | "tags";
    phrase?: boolean;
    page?: number;
}

type Success<T> = { data: T; error: null };
type Failure = { data: null; error: string };
type LibraryGenesisApiResponse<T> = Success<T> | Failure;

export class LibraryGenesisApi {
    private readonly htmlClient: typeof cheerio;
    private readonly httpClient: KyInstance;
    private readonly LIBGEN_URL = "https://libgen.is/";

    constructor(htmlClient: typeof cheerio = cheerio, httpClient: KyInstance = ky) {
        this.htmlClient = htmlClient;
        this.httpClient = httpClient.create({
            prefixUrl: this.LIBGEN_URL,
        });
    }

    public async search(query: string, queryOptions: QueryOptions = {}): Promise<LibraryGenesisApiResponse<Book[]>> {
        const sanitizedQuery = this.sanitizeQuery(query);

        if (this.isFailure(sanitizedQuery)) return sanitizedQuery;
        console.log(sanitizedQuery.data);
        const books: Book[] = [];
        const html = await this.httpClient.get('search.php', {
            searchParams: {
                req: sanitizedQuery.data,
                ...(this.getQueryOptionsObject(queryOptions)),
            }
        }).text();

        const $ = this.htmlClient.load(html);

        const table = $("table.c");

        const rows = table.find("tr").filter((_i, el) => $(el).find("td").length > 0);

        rows.each((_i, row) => {
            const cols = $(row).find("td");

            // Considerando que a ordem dos <td> é:
            // 0: ID, 1: Author(s), 2: Title, 3: Publisher, 4: Year,
            // 5: Pages, 6: Language, 7: Size, 8: Extension,
            // 9: Mirror [1], 10: Mirror [2], 11: Edit (opcional)
            const id = $(cols[0]).text().trim();
            const authors = $(cols[1]).text().trim();
            const title = $(cols[2]).text().trim();
            const publisher = $(cols[3]).text().trim();
            const year = $(cols[4]).text().trim();
            const pages = $(cols[5]).text().trim();
            const language = $(cols[6]).text().trim();
            const size = $(cols[7]).text().trim();
            const extension = $(cols[8]).text().trim();
            const mirror1 = $(cols[9]).find("a").attr("href") || "";
            const mirror2 = $(cols[10]).find("a").attr("href") || "";
            const edit = $(cols[11]).find("a").attr("href");

            books.push({
                id,
                authors,
                title,
                publisher,
                year,
                pages,
                language,
                size,
                extension,
                mirrors: [mirror1, mirror2],
                edit,
            });
        });

        return {
            data: books,
            error: null,
        }
    }

    private sanitizeQuery(query: string): LibraryGenesisApiResponse<string> {
        const alphanumericOnly = query.replace(/[^a-zA-Z0-9]/g, '');

        if (alphanumericOnly.length <= 2) {
            return {
                data: null,
                error: "Query too short",
            }
        }

        return {
            data: query,
            error: null,
        }
    }

    private isFailure(data: LibraryGenesisApiResponse<unknown>): data is Failure {
        return data.data === null;
    }

    private getQueryOptionsObject(queryOptions: QueryOptions = {}) {
        const queryObject = {};
        const { sort, searchBy, resultsPerPage, page, phrase } = queryOptions;

        if (sort && sort?.by && sort?.order) {
            queryObject['sortmode'] = sort.order;
            queryObject['sort'] = sort.by;
        }

        if (searchBy) {
            queryObject['column'] = searchBy;
        }

        if(resultsPerPage) {
            queryObject['res'] = resultsPerPage;
        }

        if(phrase === true || phrase === false) {
            queryObject['phrase'] = phrase ? 1 : 0;
        }

        if(page) {
            queryObject['page'] = page;
        }

        return queryObject;
    }
}