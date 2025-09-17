const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// Protected route
router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.json({ message: "Welcome, this is a protected route!", user: req.user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Get user by email
router.get("/user/:email", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Don't send sensitive information
    res.json({ 
      userId: user._id,
      email: user.email,
      username: user.username
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Register API
router.post("/register", async (req, res) => {
  try {
    console.log('🚀 Starting registration process...');
    console.log('📝 Register request body:', {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password ? '[MASKED]' : '✗'
    });
    
    // Log headers for debugging
    console.log('Request headers:', req.headers);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('MongoDB URI:', process.env.MONGO_URI);
    
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      console.log('❌ Missing required fields:', { 
        username: !!username, 
        email: !!email, 
        password: !!password 
      });
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    console.log('🔍 Checking for existing user...');
    // check if user exists (both email and username)
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }]
    });
    
    if (existingUser) {
      console.log('❌ User already exists:', {
        matchedEmail: existingUser.email === email.toLowerCase(),
        matchedUsername: existingUser.username === username
      });
      
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ message: "Email already registered" });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }
    console.log('✅ No existing user found')

    try {
      console.log('🔒 Hashing password...');
      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('✅ Password hashed successfully');

      console.log('📝 Creating new user...');
      // save new user
      const user = new User({
        username,
        email: email.toLowerCase(), // Store email in lowercase
        password: hashedPassword,
      });

      console.log('💾 Saving user to database...');
      await user.save();

      // Generate token immediately after registration for auto-login
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      console.log('User registered successfully:', { id: user._id, email: user.email });

      res.status(201).json({ 
        success: true,
        message: "User registered successfully",
        token 
      });
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      // Check for duplicate key error
      if (saveError.code === 11000) {
        return res.status(400).json({ 
          message: "Username or email already exists",
          field: Object.keys(saveError.keyPattern)[0]
        });
      }
      throw saveError;
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: "Server Error", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 🔑 Login API
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Logout API
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    // In a real-world app, you might want to invalidate the token on the server
    // For now, we'll just send a success response
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;
