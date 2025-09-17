require('dotenv').config();
const { Client } = require('@opensearch-project/opensearch');

const client = new Client({
  node: process.env.OPENSEARCH_HOST,
  auth: {
    username: process.env.OPENSEARCH_USERNAME,
    password: process.env.OPENSEARCH_PASSWORD
  }
});

(async () => {
  try {
    const info = await client.info();
    console.log("OpenSearch is working:", info.body);
  } catch (err) {
    console.error("Error connecting to OpenSearch:", err);
  }
})();
