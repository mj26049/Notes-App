const config = {
  port: process.env.PORT || 5001,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/notes',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  opensearchNode: process.env.OPENSEARCH_NODE || 'http://localhost:9200',
  opensearchAuth: process.env.OPENSEARCH_AUTH || 'admin:admin',
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
};

module.exports = config;
