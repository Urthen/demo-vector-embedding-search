# demo-vector-embedding-search
Demo: Redis Embedding Vector DB Search

# Prerequisites

* Install Node and Docker appropriate for your system
* Sign up for OpenAI and get a secret key

# Starting the application

* Run `npm i`
* Create a `.env` file with the following contents:
```
OPENAI_API_KEY="your secret key here"
```
* Start up the redis server with docker: `docker-compose up -d`
* Run `npm start`
* Visit `localhost:3000`