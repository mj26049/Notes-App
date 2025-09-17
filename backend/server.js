const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes");

// Load env vars
dotenv.config();

// Create Express app
const app = express();

// Add global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};
app.use(cors(corsOptions));

// Connect to MongoDB
const startServer = async () => {
  try {
    // Check if environment variables are loaded
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Connect to MongoDB first
    await connectDB();
    console.log('✅ MongoDB Connected');

    // Body parser
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`, {
          query: req.query,
          body: req.body,
          headers: {
            'content-type': req.headers['content-type'],
            'authorization': req.headers['authorization'] ? 'Bearer [TOKEN]' : 'None'
          }
        });
        next();
      });
    }

    // routes
    app.use("/api/auth", authRoutes);
    app.use("/api/notes", noteRoutes);

    // test route
    app.get("/api", (req, res) => {
      res.send("🚀 Backend is working with MongoDB!");
    });

    // Handle 404 errors
    app.use((req, res) => {
      console.log('404 Not Found:', req.method, req.path);
      res.status(404).json({ 
        message: 'Route not found',
        requestedPath: req.path,
        method: req.method
      });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Server Error:', err);
      res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        path: req.path,
        method: req.method
      });
    });

    const PORT = process.env.PORT || 5001;
    const HOST = '0.0.0.0';
    
    // Check if port is in use
    const server = app.listen(PORT, HOST, () => {
      console.log(`✅ Server running at http://${HOST}:${PORT}`);
      console.log('Try these test URLs:');
      console.log(`  - http://localhost:${PORT}/test`);
      console.log(`  - http://localhost:${PORT}/api/auth/test`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
    });

  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
