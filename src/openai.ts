import { Configuration, OpenAIApi } from 'openai';

import process from "process";

// OpenAI Setup

const MODEL_NAME = 'text-embedding-ada-002';

const openaiConfiguration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(openaiConfiguration);

export const getEmbeddingVector = async (phrase: string) => {

    // Get the embedding result from OpenAPI
    const embeddingResult = await openai.createEmbedding({
		model: MODEL_NAME,
		input: phrase
	});
    const embedding = embeddingResult.data.data[0].embedding;

    // Turn the result into a vector buffer that Redis understands
    // This may be able to be simplified, but this took a lot of bashing my head as it is.
    // Open a PR if you know more!
    const vector_blob = new Blob([Float64Array.from(embedding)], { type: 'octet/stream' });
	const vector = Buffer.from(await vector_blob.arrayBuffer());

    return vector;
}
