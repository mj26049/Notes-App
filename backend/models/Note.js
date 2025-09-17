const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  contentType: { type: String, enum: ['text', 'html'], default: 'text' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  folder: { type: mongoose.Schema.Types.ObjectId, ref: "Folder" },
  isPinned: { type: Boolean, default: false },
  tags: [{ type: String }],
  collaborators: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User"
  }],
  images: [{
    url: { type: String },
    caption: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  exportHistory: [{
    format: { type: String, enum: ['pdf', 'docx'] },
    exportedAt: { type: Date },
    exportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


module.exports = mongoose.model("Note", noteSchema);
