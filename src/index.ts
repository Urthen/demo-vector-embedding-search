import Koa from "koa";
import ejs from "ejs";
import process from "process";
import 'dotenv/config';

const app = new Koa();

app.use(async ctx => {
  const pageText = await ejs.renderFile('./src/views/index.ejs', { test_var: process.env.TEST_VAR });
  console.log("test_var", process.env.TEST_VAR);
  ctx.body = pageText;
});

app.listen(3000);