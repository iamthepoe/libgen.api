import type { LibraryGenesisResponse } from "../@types/index.ts";

export async function safeAsync<T>(fn: () => Promise<T>): Promise<LibraryGenesisResponse<T>> {
    try {
        const data = await fn();
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: err.message };
    }
}
