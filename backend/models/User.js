const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
}, { 
  timestamps: true 
});

// Create compound index for faster lookups
userSchema.index({ email: 1, username: 1 });

// Pre-save middleware to trim whitespace
userSchema.pre('save', function(next) {
  if (this.isModified('username')) {
    this.username = this.username.trim();
  }
  if (this.isModified('email')) {
    this.email = this.email.trim().toLowerCase();
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
