import { createClient, SchemaFieldTypes, VectorAlgorithms, type RedisClientType } from 'redis';
import process from "process";

const VECTOR_REDIS_PORT = process.env.VECTOR_REDIS_PORT ? Number(process.env.VECTOR_REDIS_PORT) : undefined;
const VECTOR_REDIS_PASS = process.env.VECTOR_REDIS_PASS;
const VECTOR_REDIS_CONN = process.env.VECTOR_REDIS_CONN;

// Vector dimension as returned by OpenAI
const VECTOR_DIM = 1536;

const INDEX_NAME = 'idx:search-vector-index';
const INDEX_PREFIX = "search-index"
const NUM_RESULTS = 5;

let redis: RedisClientType;

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
            console.log('Index exists already, skipped creation.');
        } else {
            console.error(e);
            process.exit(1);
        }
    }
}

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

export const searchPhrases = async(vector: Buffer): Promise<SearchResult[]> => {

    const client = await getRedis();
    await createIndex();

    const redis_query = `*=>[KNN ${NUM_RESULTS} @embedding $vector AS vector_score]`;
    
    let redis_results;
	try {
		redis_results = await redis.ft.search(INDEX_NAME, redis_query, {
			SORTBY: {
				BY: 'vector_score',
				DIRECTION: 'DESC'
			},
			RETURN: ['phrase'],
			DIALECT: 2,
			PARAMS: { vector }
		});
	} catch (e) {
		console.error('Error querying redis:', e);
	}

	if (redis_results) {
		return redis_results.documents.map((r) => r.value).reverse() as SearchResult[];
	} else {
		return [];
	}

}