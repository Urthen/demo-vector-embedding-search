import 'dotenv/config';

import Koa from "koa";
import Router from "@koa/router";
import koaBody from "koa-body";
import ejs from "ejs";
import { getEmbeddingVector } from "./openai";
import { type SearchResult, addPhrase, searchPhrases } from './redis';


const findMatches = async (query: string): Promise<SearchResult[]> => {
  const embeddingVector = await getEmbeddingVector(query);
  return await searchPhrases(embeddingVector);
}

const addMatch = async (phrase: string) => {
  const embeddingVector = await getEmbeddingVector(phrase);
  await addPhrase(phrase, embeddingVector);
}

// Koa & Router Setup
const app = new Koa();

const router = new Router();

router.get('/', async (ctx) => {
  const pageText = await ejs.renderFile('./src/views/index.ejs', { });
  ctx.body = pageText;
});

router.post('/add', koaBody(), async (ctx) => {
  // search in the vector DB for best embedding
  const body = ctx.request.body;
  const phrase = body.add_phrase;

  await addMatch(phrase);

  const pageText = await ejs.renderFile('./src/views/index.ejs', { message: "Phrase Added: " + phrase });
  ctx.body = pageText;
});

router.post('/search', koaBody(), async (ctx) => {
  // search in the vector DB for best embedding
  const body = ctx.request.body;
  const phrase = body.search_phrase;

  const searchResults = await findMatches(phrase);

  console.log('results', searchResults)

  const pageText = await ejs.renderFile('./src/views/index.ejs', { 
    message: "Search results for: " + phrase,
    searchResults 
  });
  ctx.body = pageText;
});

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000);