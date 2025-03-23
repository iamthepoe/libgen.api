import * as cheerio from "cheerio";
import ky from "ky";
import type { KyInstance } from "ky";
import type { QueryOptions, LibraryGenesisResponse, Book, Failure } from "./@types/index.ts";
import { safeAsync } from "./utils/index.ts";

export class LibraryGenesisApi {
    private readonly htmlClient: typeof cheerio;
    private readonly httpClient: KyInstance;
    private readonly LIBGEN_URL = "https://libgen.is/";

    constructor(htmlClient: typeof cheerio = cheerio, httpClient: KyInstance = ky) {
        this.htmlClient = htmlClient;
        this.httpClient = httpClient.create();
    }

    public async search(query: string, queryOptions: QueryOptions = {}): Promise<LibraryGenesisResponse<Book[]>> {
        const sanitizedQuery = this.sanitizeQuery(query);
        if (this.isFailure(sanitizedQuery)) return sanitizedQuery;

        const response = await safeAsync(() =>
            this.httpClient.get("search.php", {
                searchParams: {
                    req: sanitizedQuery.data,
                    ...(this.getQueryOptionsObject(queryOptions)),
                },
                prefixUrl: this.LIBGEN_URL,
            }).text()
        );

        if (this.isFailure(response)) return response;

        const books = this.parseBooksFromHtml(response.data);
        return { data: books, error: null };
    }

    private parseBooksFromHtml(html: string): Book[] {
        const $ = this.htmlClient.load(html);
        const table = $("table.c");
        const rows = table.find("tr").filter((_i, el) => $(el).find("td").length > 0).slice(1);
        
        return rows.map((_i, row) => {
            const cols = $(row).find("td");

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

            return {
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
                download: () => this.downloadBook(mirror1),
            };
        }).get();
    }

    private async downloadBook(mirrorUrl: string): Promise<LibraryGenesisResponse<Buffer>> {
        const pageResponse = await safeAsync(() => this.httpClient.get(mirrorUrl));
        if (this.isFailure(pageResponse)) return pageResponse;

        const html = await pageResponse.data.text();
        const downloadLinkResult = this.getDownloadLinkbyFirstMirrorHtml(html);
        if (this.isFailure(downloadLinkResult)) return downloadLinkResult;

        const fileResponse = await safeAsync(() => this.httpClient.get(downloadLinkResult.data));
        if (this.isFailure(fileResponse)) return fileResponse;

        const buffer = await fileResponse.data.arrayBuffer();
        return { data: Buffer.from(buffer), error: null };
    }

    private getDownloadLinkbyFirstMirrorHtml(html: string): LibraryGenesisResponse<string> {
        const $ = this.htmlClient.load(html);
        const downloadLink = $('a').filter((_i, el) => $(el).text().includes('GET')).attr('href');

        if (!downloadLink) {
            return { data: null, error: "Download link not found" };
        }

        return { data: downloadLink, error: null };
    }

    private sanitizeQuery(query: string): LibraryGenesisResponse<string> {
        const alphanumericOnly = query.replace(/[^a-zA-Z0-9]/g, '');
        if (alphanumericOnly.length <= 2) {
            return { data: null, error: "Query too short" };
        }
        return { data: query, error: null };
    }

    private isFailure(data: LibraryGenesisResponse<unknown>): data is Failure {
        return data.data === null;
    }

    private getQueryOptionsObject(queryOptions: QueryOptions = {}) {
        const queryObject: Record<string, any> = {};
        const { sort, searchBy, resultsPerPage, page, phrase } = queryOptions;

        if (sort?.by && sort?.order) {
            queryObject["sortmode"] = sort.order;
            queryObject["sort"] = sort.by;
        }

        if (searchBy) queryObject["column"] = searchBy;
        if (resultsPerPage) queryObject["res"] = resultsPerPage;
        if (typeof phrase === "boolean") queryObject["phrase"] = phrase ? 1 : 0;
        if (page) queryObject["page"] = page;

        return queryObject;
    }
}
