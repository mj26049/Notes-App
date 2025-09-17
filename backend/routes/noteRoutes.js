const express = require("express");
const Note = require("../models/Note");
const Folder = require("../models/Folder");
const authMiddleware = require("../middleware/authMiddleware");
const client = require("../config/opensearch");
const upload = require("../config/multer");
const cloudinary = require("../config/cloudinary");
const PDFDocument = require("pdfkit");
const { Document, Packer, Paragraph, TextRun } = require("docx");
const { body, validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// ------------------ INDEX INIT ------------------
async function initializeIndex() {
  try {
    // First delete the index if it exists
    try {
      const indexExists = await client.indices.exists({ index: 'notes' });
      if (indexExists.body) {
        console.log('🗑️ Deleting existing notes index');
        await client.indices.delete({ index: 'notes' });
      }
    } catch (err) {
      console.log('No existing index to delete');
    }

    // Create the index with proper settings and mappings
    console.log('📝 Creating new notes index...');
    await client.indices.create({
      index: 'notes',
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              default: {
                type: 'standard',
                stopwords: '_english_'
              }
            }
          }
        },
        mappings: {
          properties: {
            title: { 
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256
                },
                ngram: {
                  type: 'text',
                  analyzer: 'ngram_analyzer'
                }
              }
            },
            content: { 
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: {
                  type: 'keyword',
                  ignore_above: 256
                },
                ngram: {
                  type: 'text',
                  analyzer: 'ngram_analyzer'
                }
              }
            },
            tags: { type: 'keyword' },
            user: { type: 'keyword' },
            collaborators: { type: 'keyword' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' }
          }
        },
        settings: {
          analysis: {
            analyzer: {
              ngram_analyzer: {
                type: 'custom',
                tokenizer: 'ngram_tokenizer',
                filter: ['lowercase']
              }
            },
            tokenizer: {
              ngram_tokenizer: {
                type: 'ngram',
                min_gram: 3,
                max_gram: 4,
                token_chars: ['letter', 'digit']
              }
            }
          }
        }
      }
    });

    // Wait for index to be ready
    await client.cluster.health({
      index: 'notes',
      wait_for_status: 'yellow'
    });

    console.log('✅ OpenSearch index initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing index:', error);
  }
}
initializeIndex();

// ------------------ CREATE ------------------
router.post("/", 
  authMiddleware,
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("content").trim().notEmpty().withMessage("Content is required"),
    body("tags").optional().isArray().withMessage("Tags must be an array")
  ],
  async (req, res) => {
    try {
      console.log('📝 Create note request received:', {
        body: req.body,
        user: req.user?.id
      });

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({ 
          message: "Validation failed",
          errors: errors.array() 
        });
      }

      // Check authentication
      if (!req.user?.id) {
        console.error('❌ User ID missing in request');
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Prepare note data
      const { title, content, tags } = req.body;
      const cleanedTags = Array.isArray(tags) 
        ? tags.map(tag => tag.trim()).filter(Boolean)
        : [];

      const note = new Note({
        title: title.trim(),
        content: content.trim(),
        tags: cleanedTags,
        user: req.user.id,
        collaborators: []
      });

      // Save to MongoDB
      console.log('💾 Saving note to MongoDB...');
      await note.save();
      console.log('✅ Note saved to MongoDB successfully');

      // Index in OpenSearch
      try {
        console.log('📊 Indexing note in OpenSearch...');
        const indexResponse = await client.index({
          index: "notes",
          id: note._id.toString(),
          body: {
            title: note.title,
            content: note.content,
            tags: note.tags,
            user: note.user.toString(),
            collaborators: note.collaborators.map(c => c.toString()),
            createdAt: new Date(note.createdAt).toISOString(),
            updatedAt: new Date(note.updatedAt).toISOString()
          },
          refresh: true // Ensure the document is immediately searchable
        });
        
        // Verify the document was indexed
        const verifyIndex = await client.get({
          index: "notes",
          id: note._id.toString()
        });
        
        console.log('✅ Note indexed in OpenSearch successfully:', {
          id: indexResponse.body._id,
          index: indexResponse.body._index,
          version: indexResponse.body._version
        });
      } catch (indexError) {
        console.error('❌ Failed to index note in OpenSearch:', indexError);
        // Log the error but don't fail the request since MongoDB save was successful
      }

      res.status(201).json({ 
        message: "Note created successfully", 
        note: {
          ...note.toJSON(),
          searchable: true // Indicate that the note is searchable
        }
      });
    } catch (error) {
      console.error("❌ Create note error:", error);
      res.status(500).json({ 
        message: "Failed to create note", 
        error: error.message 
      });
    }
});

// ------------------ SEARCH (with pagination + filter + sort) ------------------
router.get("/search", authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Search request received:', {
      query: req.query,
      user: req.user.id
    });

    const { 
      query, 
      tags, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10, 
      sort = "createdAt:desc" 
    } = req.query;

    // If no search criteria provided, return all notes
    if (!query?.trim() && !tags?.trim() && !startDate && !endDate) {
      console.log('No search criteria, returning all notes');
      return res.redirect('/api/notes');
    }

    const must = [];
    const filter = [];
    const should = [];

    // Access control filter
    filter.push({
      bool: {
        should: [
          { term: { user: req.user.id } },
          { term: { collaborators: req.user.id } }
        ],
        minimum_should_match: 1
      }
    });

    // Text search
    if (query?.trim()) {
      const searchQuery = query.trim();
      console.log('Processing text search:', searchQuery);

      // Match phrase prefix for partial word matches at the end
      should.push(
        { match_phrase_prefix: { title: { query: searchQuery, boost: 4.0, slop: 3 } } },
        { match_phrase_prefix: { content: { query: searchQuery, boost: 2.0, slop: 3 } } }
      );

      // Fuzzy match for typo tolerance
      should.push({
        multi_match: {
          query: searchQuery,
          fields: ["title^3", "content^2", "tags"],
          fuzziness: "AUTO",
          prefix_length: 2,
          operator: "or",
          minimum_should_match: "50%"
        }
      });

      // Term query for exact matches
      const terms = searchQuery.toLowerCase().split(/\s+/);
      terms.forEach(term => {
        should.push(
          { term: { "title.keyword": { value: term, boost: 5.0 } } },
          { term: { "content.keyword": { value: term, boost: 3.0 } } },
          { term: { "tags": { value: term, boost: 4.0 } } }
        );
      });

      must.push({
        bool: {
          should,
          minimum_should_match: 1,
          boost: 1.0
        }
      });
    }

    // Tags filter
    if (tags?.trim()) {
      const tagsList = tags.split(",").map(tag => tag.trim()).filter(Boolean);
      if (tagsList.length > 0) {
        filter.push({
          terms: { tags: tagsList }
        });
      }
    }

    // Date range filter
    if (startDate || endDate) {
      console.log('Adding date range filter:', { startDate, endDate });
      const range = { createdAt: {} };
      
      if (startDate) {
        const start = new Date(startDate);
        range.createdAt.gte = start.toISOString();
      }
      
      if (endDate) {
        const end = new Date(endDate);
        if (end instanceof Date && !isNaN(end)) {
          // Set to end of day for the end date
          end.setHours(23, 59, 59, 999);
          range.createdAt.lte = end.toISOString();
        }
      }
      
      filter.push({ range });
      console.log('Date range filter added:', { range });
    }

    // Parse sort options
    const [sortField = "createdAt", sortOrder = "desc"] = (sort || "").split(":");
    
    // Refresh index to ensure all documents are searchable
    await client.indices.refresh({ index: 'notes' });

    console.log('🔍 Executing search with query:', {
      must,
      filter,
      sort: { [sortField]: sortOrder }
    });

    // Execute OpenSearch query
    const response = await client.search({
      index: "notes",
      body: {
        from: (page - 1) * limit,
        size: limit,
        sort: [{ [sortField]: { order: sortOrder } }],
        query: {
          bool: {
            must,
            filter
          }
        },
        highlight: {
          fields: {
            title: {
              number_of_fragments: 0,
              pre_tags: ["<mark>"],
              post_tags: ["</mark>"]
            },
            content: {
              number_of_fragments: 1,
              fragment_size: 200,
              pre_tags: ["<mark>"],
              post_tags: ["</mark>"]
            },
            "title.ngram": {
              number_of_fragments: 0,
              pre_tags: ["<mark>"],
              post_tags: ["</mark>"]
            },
            "content.ngram": {
              number_of_fragments: 1,
              fragment_size: 200,
              pre_tags: ["<mark>"],
              post_tags: ["</mark>"]
            }
          },
          require_field_match: false,
          highlight_query: {
            bool: {
              should: [
                { match_phrase_prefix: { title: { query: query?.trim() || "" } } },
                { match_phrase_prefix: { content: { query: query?.trim() || "" } } },
                { match: { "title.ngram": { query: query?.trim() || "" } } },
                { match: { "content.ngram": { query: query?.trim() || "" } } }
              ]
            }
          }
        }
      }
    });

    // Get all note IDs from search results
    const noteIds = response.body.hits.hits.map(hit => hit._id);
    
    // Fetch full note objects from MongoDB with populated fields
    const notes = await Note.find({ _id: { $in: noteIds } })
      .populate('user', 'username email')
      .populate('collaborators', 'username email');

    // Format response
    const results = response.body.hits.hits.map(hit => {
      const note = notes.find(n => n._id.toString() === hit._id);
      let highlightedContent = hit.highlight?.content?.[0] || hit._source.content;
      if (highlightedContent.length > 200) {
        highlightedContent = highlightedContent.substring(0, 200) + '...';
      }

      return {
        ...hit._source,
        _id: hit._id,
        score: hit._score,
        highlights: {
          title: hit.highlight?.title?.[0] || hit._source.title,
          content: highlightedContent
        },
        user: note?.user,
        collaborators: note?.collaborators,
        matched: {
          title: hit.highlight?.title !== undefined,
          content: hit.highlight?.content !== undefined,
          tags: hit.highlight?.tags !== undefined
        }
      };
    });

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total: response.body.hits.total.value,
      totalPages: Math.ceil(response.body.hits.total.value / limit),
      notes: results  // Changed from 'results' to 'notes' to match regular endpoint
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Search Error", error: error.message });
  }
});



// ------------------ UPDATE ------------------
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    console.log('Update note request:', {
      noteId: req.params.id,
      userId: req.user.id,
      body: req.body
    });

    const { title, content, tags } = req.body;
    
    // Find note that user either owns or collaborates on
    const existingNote = await Note.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user.id },
        { collaborators: req.user.id }
      ]
    }).populate('user', 'username email')
      .populate('collaborators', 'username email');

    if (!existingNote) {
      console.log('Note not found or not authorized');
      return res.status(404).json({ message: "Note not found or not authorized" });
    }

    // Update note fields
    existingNote.title = title || existingNote.title;
    existingNote.content = content || existingNote.content;
    existingNote.tags = tags || existingNote.tags;
    existingNote.updatedAt = new Date();

    // Save to MongoDB
    const savedNote = await existingNote.save();
    console.log('Note saved successfully:', savedNote._id);

    // Update OpenSearch
    try {
      await client.index({
        index: "notes",
        id: existingNote._id.toString(),
        body: {
          title: existingNote.title,
          content: existingNote.content,
          tags: existingNote.tags,
          user: existingNote.user._id.toString(),
          collaborators: existingNote.collaborators.map(c => c._id.toString()),
          createdAt: existingNote.createdAt,
          updatedAt: existingNote.updatedAt
        },
        refresh: true
      });
      console.log('OpenSearch index updated');
    } catch (searchError) {
      console.error('OpenSearch update error:', searchError);
      // Continue with response even if OpenSearch update fails
    }

    res.json({ 
      message: "Note updated successfully", 
      note: savedNote 
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ 
      message: "Error updating note", 
      error: error.message 
    });
  }
});

// ------------------ DELETE ------------------
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // Find the note first to check both ownership and collaboration
    const note = await Note.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user.id },
        { collaborators: req.user.id }
      ]
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found or not authorized" });
    }

    // Only allow deletion by the owner
    if (note.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the note owner can delete it" });
    }

    // Delete the note
    await Note.deleteOne({ _id: req.params.id });
    
    // Delete from OpenSearch
    try {
      await client.delete({ 
        index: "notes", 
        id: note._id.toString(),
        refresh: true  // Ensure immediate index update
      });
    } catch (searchError) {
      console.error('Error deleting from OpenSearch:', searchError);
      // Continue with the response even if OpenSearch delete fails
    }

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ message: "Error deleting note", error: error.message });
  }
});

// ------------------ COLLABORATORS ------------------
router.post("/:id/collaborators", authMiddleware, async (req, res) => {
  try {
    console.log('Add collaborator request:', {
      noteId: req.params.id,
      requestBody: req.body
    });

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    console.log('Processing request to add collaborator:', cleanEmail);
    
    // Find the note with owner info
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id })
      .populate('user', 'username email');
    
    if (!note) {
      console.log('Note not found or unauthorized:', {
        noteId: req.params.id,
        userId: req.user.id
      });
      return res.status(404).json({ message: "Note not found or not authorized" });
    }

    // Find user by email
    const User = require('../models/User');
    console.log('Searching for user with email:', cleanEmail);
    const collaborator = await User.findOne({ email: cleanEmail });
    
    console.log('User search result:', collaborator ? {
      found: true,
      id: collaborator._id,
      email: collaborator.email
    } : { found: false });
    
    if (!collaborator) {
      return res.status(404).json({ 
        message: "User not found with this email. Please ensure the user has registered." 
      });
    }

    // Check if collaborator is the owner
    if (note.user._id.toString() === collaborator._id.toString()) {
      return res.status(400).json({ message: "Cannot add note owner as collaborator" });
    }

    // Check if collaborator is already added
    if (note.collaborators.some(c => c.toString() === collaborator._id.toString())) {
      return res.status(400).json({ message: "User is already a collaborator" });
    }

    // Add collaborator
    note.collaborators.push(collaborator._id);
    await note.save();

    // Get updated note with populated fields
    const updatedNote = await Note.findById(note._id)
      .populate('user', 'username email')
      .populate('collaborators', 'username email');

    // Update OpenSearch index
    await client.update({
      index: "notes",
      id: note._id.toString(),
      body: {
        doc: {
          collaborators: note.collaborators.map(id => id.toString()),
          updatedAt: new Date().toISOString()
        },
        refresh: true
      }
    });

    res.json({ 
      success: true,
      message: `Successfully added ${collaborator.username} (${email}) as a collaborator`,
      note: updatedNote
    });
  } catch (error) {
    console.error("Error adding collaborator:", {
      error: error,
      stack: error.stack,
      noteId: req.params.id,
      email: email
    });
    res.status(500).json({ 
      message: "Error adding collaborator", 
      error: error.message,
      details: error.stack
    });
  }
});

// ------------------ LIST (with pagination) ------------------
router.get("/", authMiddleware, async (req, res) => {
  try {
    console.log('List notes request received for user:', req.user.id);
    
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { $or: [{ user: req.user.id }, { collaborators: req.user.id }] };

    const total = await Note.countDocuments(filter);
    const notes = await Note.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select("-__v")
      .populate({
        path: 'user',
        select: 'username email'
      })
      .populate({
        path: 'collaborators',
        select: 'username email'
      });

    res.json({
      message: "Notes retrieved successfully",
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      notes
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ message: "Error fetching notes", error: error.message });
  }
});

// Upload image to note
router.post("/:id/images", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!note) {
      return res.status(404).json({ message: "Note not found or not authorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "notes",
      resource_type: "auto"
    });

    // Delete local file after upload
    fs.unlinkSync(req.file.path);

    // Add image to note
    note.images.push({
      url: result.secure_url,
      caption: req.body.caption || '',
      uploadedAt: new Date()
    });

    await note.save();

    // Update OpenSearch
    await client.update({
      index: "notes",
      id: note._id.toString(),
      body: {
        doc: {
          images: note.images
        }
      }
    });

    res.json({ 
      message: "Image uploaded successfully",
      image: note.images[note.images.length - 1]
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Error deleting local file:", e);
      }
    }
    res.status(500).json({ 
      message: "Error uploading image", 
      error: error.message 
    });
  }
});

// Delete image from note
router.delete("/:noteId/images/:imageId", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.noteId, user: req.user.id });
    if (!note) {
      return res.status(404).json({ message: "Note not found or not authorized" });
    }

    const imageIndex = note.images.findIndex(img => img._id.toString() === req.params.imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Delete from Cloudinary
    const publicId = note.images[imageIndex].url.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicId);

    // Remove from note
    note.images.splice(imageIndex, 1);
    await note.save();

    // Update OpenSearch
    await client.update({
      index: "notes",
      id: note._id.toString(),
      body: {
        doc: {
          images: note.images
        }
      }
    });

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ 
      message: "Error deleting image", 
      error: error.message 
    });
  }
});

// Toggle pin status
router.patch("/:id/pin", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!note) {
      return res.status(404).json({ message: "Note not found or not authorized" });
    }

    note.isPinned = !note.isPinned;
    await note.save();

    // Update OpenSearch
    await client.update({
      index: "notes",
      id: note._id.toString(),
      body: {
        doc: {
          isPinned: note.isPinned
        }
      }
    });

    res.json({ 
      message: `Note ${note.isPinned ? 'pinned' : 'unpinned'} successfully`,
      isPinned: note.isPinned
    });
  } catch (error) {
    console.error("Error toggling pin status:", error);
    res.status(500).json({ 
      message: "Error updating pin status", 
      error: error.message 
    });
  }
});

// Move note to folder
router.patch("/:id/move", 
  authMiddleware,
  [
    body("folderId").isMongoId().withMessage("Invalid folder ID")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: errors.array() 
        });
      }

      const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
      if (!note) {
        return res.status(404).json({ message: "Note not found or not authorized" });
      }

      const folder = await Folder.findOne({ 
        _id: req.body.folderId, 
        user: req.user.id 
      });
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      note.folder = folder._id;
      await note.save();

      // Update OpenSearch
      await client.update({
        index: "notes",
        id: note._id.toString(),
        body: {
          doc: {
            folder: folder._id.toString()
          }
        }
      });

      res.json({ 
        message: "Note moved successfully",
        folder: folder._id
      });
    } catch (error) {
      console.error("Error moving note:", error);
      res.status(500).json({ 
        message: "Error moving note", 
        error: error.message 
      });
    }
});

// Export note
router.get("/:id/export/:format", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!note) {
      return res.status(404).json({ message: "Note not found or not authorized" });
    }

    const format = req.params.format.toLowerCase();
    let buffer;

    if (format === 'pdf') {
      // Generate PDF
      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        buffer = Buffer.concat(chunks);
        
        // Record export
        note.exportHistory.push({
          format: 'pdf',
          exportedAt: new Date()
        });
        note.save();

        // Send response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${note.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`);
        res.send(buffer);
      });

      // Add content to PDF
      doc.fontSize(24).text(note.title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(note.content);
      
      if (note.images?.length > 0) {
        for (const image of note.images) {
          doc.addPage();
          doc.image(image.url, {
            fit: [400, 300],
            align: 'center'
          });
          if (image.caption) {
            doc.moveDown();
            doc.fontSize(10).text(image.caption, { align: 'center' });
          }
        }
      }

      doc.end();
    } else if (format === 'docx') {
      // Generate Word document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: note.title,
                  bold: true,
                  size: 32
                })
              ],
              spacing: {
                after: 200
              }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: note.content
                })
              ]
            })
          ]
        }]
      });

      if (note.images?.length > 0) {
        doc.addSection({
          children: note.images.map(image => [
            new Paragraph({
              children: [
                new ImageRun({
                  data: fs.readFileSync(image.url),
                  transformation: {
                    width: 400,
                    height: 300
                  }
                })
              ],
              alignment: AlignmentType.CENTER
            }),
            image.caption ? new Paragraph({
              children: [
                new TextRun({
                  text: image.caption,
                  size: 20
                })
              ],
              alignment: AlignmentType.CENTER
            }) : null
          ].filter(Boolean)).flat()
        });
      }

      buffer = await Packer.toBuffer(doc);

      // Record export
      note.exportHistory.push({
        format: 'docx',
        exportedAt: new Date()
      });
      await note.save();

      // Send response
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${note.title.replace(/[^a-z0-9]/gi, '_')}.docx"`);
      res.send(buffer);
    } else {
      return res.status(400).json({ message: "Unsupported export format" });
    }
  } catch (error) {
    console.error("Error exporting note:", error);
    res.status(500).json({ 
      message: "Error exporting note", 
      error: error.message 
    });
  }
});

module.exports = router;
