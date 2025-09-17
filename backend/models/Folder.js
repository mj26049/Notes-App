const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  parent: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Folder",
    default: null 
  },
  color: { 
    type: String,
    default: "#4F46E5" // Default indigo color
  },
  icon: {
    type: String,
    default: "folder" // Default icon name
  },
  isRoot: {
    type: Boolean,
    default: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting all notes in this folder
folderSchema.virtual('notes', {
  ref: 'Note',
  localField: '_id',
  foreignField: 'folder'
});

// Virtual for getting child folders
folderSchema.virtual('subfolders', {
  ref: 'Folder',
  localField: '_id',
  foreignField: 'parent'
});

// Ensure a user can't have two root folders
folderSchema.index({ user: 1, isRoot: 1 }, { 
  unique: true, 
  partialFilterExpression: { isRoot: true } 
});

// Ensure folder names are unique within the same parent folder for the same user
folderSchema.index({ name: 1, parent: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Folder", folderSchema);
