import { createClient, SchemaFieldTypes, VectorAlgorithms, type RedisClientType } from 'redis';

// Load Redis connection info from environment
const VECTOR_REDIS_PORT = import.meta.env.VITE_VECTOR_REDIS_PORT ? Number(import.meta.env.VITE_VECTOR_REDIS_PORT) : undefined;
const VECTOR_REDIS_PASS = import.meta.env.VITE_VECTOR_REDIS_PASS;
const VECTOR_REDIS_CONN = import.meta.env.VITE_VECTOR_REDIS_CONN;

// Vector dimension as returned by OpenAI
const VECTOR_DIM = 1536;

// Search index information
const INDEX_NAME = 'idx:search-vector-index';
const INDEX_PREFIX = "search-index"
const NUM_RESULTS = 5;

let redis: RedisClientType;

// Get redis client singleton
const getRedis = async (): Promise<RedisClientType> => {
    if (!redis) {
        redis = createClient({
            password: VECTOR_REDIS_PASS,
            socket: {
                host: VECTOR_REDIS_CONN,
                port: VECTOR_REDIS_PORT
            }
        });
        await redis.connect();
    }
    return redis;
};

// Create index if it doesn't already exist
const createIndex = async () => {
    const client = await getRedis();

    try {
        await client.ft.create(INDEX_NAME, {
            phrase: {
                type: SchemaFieldTypes.TEXT
            },
            embedding: {
                type: SchemaFieldTypes.VECTOR,
                ALGORITHM: VectorAlgorithms.HNSW,
                TYPE: 'FLOAT64',
                DIM: VECTOR_DIM,
                DISTANCE_METRIC: 'COSINE'
              }
        }, {
            ON: 'HASH',
            PREFIX: INDEX_PREFIX
        });
        console.log("Index created")
    } catch (e: any) {
        if (e.message === 'Index already exists') {
            // If it already exists, no problem.
            console.log('Index already exists');
        } else {
            // If any other error (probably bad connection information) log it and shut down for simplicity
            console.error(e);
            process.exit(1);
        }
    }
}

// Add phrase and associated embedding vector to the Redis search index
export const addPhrase = async (phrase: string, vector: Buffer) => {
    const client = await getRedis();
    await createIndex();
    const phraseId = phrase.toLowerCase().replace(/\s/g, "");
    const key = `${INDEX_PREFIX}:${phraseId}`;
    const mapping = {
        "phrase": phrase,
        "embedding": vector
    };

    client.hSet(key, mapping);
}

export type SearchResult = {
	phrase: string;
};

// Find phrase closest to given embedding vector
export const searchPhrases = async(vector: Buffer): Promise<SearchResult[]> => {


    // Get redis and create index if it doesn't exist, just to simplify logic
    const client = await getRedis();
    await createIndex();

    // Query for nearest NUM_RESULTS
    // Adapted from OpenAI example
    // https://github.com/openai/openai-cookbook/blob/main/examples/vector_databases/redis/redisqna/redisqna.ipynb
    const redis_query = `*=>[KNN ${NUM_RESULTS} @embedding $vector AS vector_score]`;
    
    let redis_results;
	try {
		redis_results = await redis.ft.search(INDEX_NAME, redis_query, {
			SORTBY: {
				BY: 'vector_score',
				DIRECTION: 'ASC'
			},
			RETURN: ['phrase'],
			DIALECT: 2,
			PARAMS: { vector }
		});
	} catch (e) {
		console.error('Error querying redis:', e);
	}

    // Process results for presentation
	if (redis_results) {
		return redis_results.documents.map((r) => r.value) as SearchResult[];
	} else {
		return [];
	}

}
