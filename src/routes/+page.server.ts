import type { RequestEvent } from "./$types";
import { getEmbeddingVector } from "$lib/server/openai";
import { type SearchResult, addPhrase, searchPhrases } from '$lib/server/redis';

// Get embedding vector for phrase and search for it in Redis
const findMatches = async (phrase: string): Promise<SearchResult[]> => {
  const embeddingVector = await getEmbeddingVector(phrase);
  return await searchPhrases(embeddingVector);
}

// Get embedding vetor for phrase and add it to Redis
const addMatch = async (phrase: string) => {
  const embeddingVector = await getEmbeddingVector(phrase);
  await addPhrase(phrase, embeddingVector);
}

// Expose possible form actions for the route
export const actions = {
    add: async ({request}: RequestEvent) => {
        const data = await request.formData();
        const phrase = data.get('add_phrase') as string;
        
        await addMatch(phrase);

        return { success: true, phrase };
    },
    search: async ({request}: RequestEvent) => {
        const data = await request.formData();
        const phrase = data.get('search_phrase') as string;
        
        const results = await findMatches(phrase);

        return { success: true, results };
    }
};
