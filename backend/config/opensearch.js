const { Client } = require("@opensearch-project/opensearch");

const client = new Client({
  node: process.env.OPENSEARCH_URL || "http://localhost:9200",
  ssl: {
    rejectUnauthorized: false
  },
  // No auth needed since DISABLE_SECURITY_PLUGIN=true in docker-compose
});

client.ping()
  .then(() => console.log("✅ OpenSearch Connected"))
  .catch(err => console.error("❌ OpenSearch Connection Error:", err));

module.exports = client;
