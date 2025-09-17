const express = require("express");
const router = express.Router();
const Folder = require("../models/Folder");
const authMiddleware = require("../middleware/authMiddleware");
const { body, validationResult } = require("express-validator");

// Create root folder for user if it doesn't exist
const ensureRootFolder = async (userId) => {
  let rootFolder = await Folder.findOne({ user: userId, isRoot: true });
  if (!rootFolder) {
    rootFolder = await Folder.create({
      name: "My Notes",
      user: userId,
      isRoot: true,
      description: "Root folder for all your notes"
    });
  }
  return rootFolder;
};

// Get folder structure
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Ensure root folder exists
    await ensureRootFolder(req.user.id);

    // Get all folders for user with populated subfolders
    const folders = await Folder.find({ user: req.user.id })
      .populate({
        path: 'subfolders',
        select: 'name description color icon',
        populate: {
          path: 'subfolders',
          select: 'name description color icon'
        }
      })
      .populate({
        path: 'notes',
        select: 'title isPinned updatedAt'
      });

    res.json({ 
      message: "Folders retrieved successfully",
      folders 
    });
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ 
      message: "Error fetching folders", 
      error: error.message 
    });
  }
});

// Create new folder
router.post("/", 
  authMiddleware,
  [
    body("name").trim().notEmpty().withMessage("Folder name is required"),
    body("parent").optional().isMongoId().withMessage("Invalid parent folder ID")
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

      const { name, description, parent, color, icon } = req.body;

      // If no parent specified, use root folder
      let parentFolder;
      if (!parent) {
        parentFolder = await ensureRootFolder(req.user.id);
      } else {
        parentFolder = await Folder.findOne({ 
          _id: parent, 
          user: req.user.id 
        });
        if (!parentFolder) {
          return res.status(404).json({ 
            message: "Parent folder not found" 
          });
        }
      }

      const folder = new Folder({
        name: name.trim(),
        description: description?.trim(),
        parent: parentFolder._id,
        user: req.user.id,
        color,
        icon
      });

      await folder.save();

      res.status(201).json({
        message: "Folder created successfully",
        folder
      });
    } catch (error) {
      console.error("Error creating folder:", error);
      if (error.code === 11000) {
        return res.status(400).json({
          message: "A folder with this name already exists in the selected location"
        });
      }
      res.status(500).json({ 
        message: "Error creating folder", 
        error: error.message 
      });
    }
});

// Update folder
router.put("/:id",
  authMiddleware,
  [
    body("name").optional().trim().notEmpty().withMessage("Folder name cannot be empty")
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

      const folder = await Folder.findOne({ 
        _id: req.params.id, 
        user: req.user.id 
      });

      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      if (folder.isRoot) {
        return res.status(400).json({ 
          message: "Cannot modify root folder" 
        });
      }

      const { name, description, color, icon } = req.body;

      if (name) folder.name = name.trim();
      if (description !== undefined) folder.description = description?.trim();
      if (color) folder.color = color;
      if (icon) folder.icon = icon;

      await folder.save();

      res.json({
        message: "Folder updated successfully",
        folder
      });
    } catch (error) {
      console.error("Error updating folder:", error);
      if (error.code === 11000) {
        return res.status(400).json({
          message: "A folder with this name already exists in this location"
        });
      }
      res.status(500).json({ 
        message: "Error updating folder", 
        error: error.message 
      });
    }
});

// Delete folder
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const folder = await Folder.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    });

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (folder.isRoot) {
      return res.status(400).json({ 
        message: "Cannot delete root folder" 
      });
    }

    // Move all notes to parent folder
    await Note.updateMany(
      { folder: folder._id },
      { folder: folder.parent }
    );

    // Move all subfolders to parent folder
    await Folder.updateMany(
      { parent: folder._id },
      { parent: folder.parent }
    );

    await folder.delete();

    res.json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ 
      message: "Error deleting folder", 
      error: error.message 
    });
  }
});

// Move folder
router.post("/:id/move", 
  authMiddleware,
  [
    body("targetFolderId").isMongoId().withMessage("Invalid target folder ID")
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

      const { targetFolderId } = req.body;
      
      const folder = await Folder.findOne({ 
        _id: req.params.id, 
        user: req.user.id 
      });

      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      if (folder.isRoot) {
        return res.status(400).json({ 
          message: "Cannot move root folder" 
        });
      }

      const targetFolder = await Folder.findOne({ 
        _id: targetFolderId, 
        user: req.user.id 
      });

      if (!targetFolder) {
        return res.status(404).json({ 
          message: "Target folder not found" 
        });
      }

      // Prevent moving folder into itself or its descendants
      let current = targetFolder;
      while (current) {
        if (current._id.toString() === folder._id.toString()) {
          return res.status(400).json({ 
            message: "Cannot move folder into itself or its descendants" 
          });
        }
        current = await Folder.findById(current.parent);
      }

      folder.parent = targetFolder._id;
      await folder.save();

      res.json({
        message: "Folder moved successfully",
        folder
      });
    } catch (error) {
      console.error("Error moving folder:", error);
      res.status(500).json({ 
        message: "Error moving folder", 
        error: error.message 
      });
    }
});

module.exports = router;
