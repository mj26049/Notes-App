// sync_notes.js
const mongoose = require("mongoose");
const client = require("./config/opensearch");
const Note = require("./models/Note");
const dotenv = require("dotenv");

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("Connected to MongoDB");

  const notes = await Note.find();
  for (const note of notes) {
    await client.index({
      index: "notes",
      id: note._id.toString(),
      body: {
        title: note.title,
        content: note.content,
        tags: note.tags,
        user: note.user.toString(),
        createdAt: note.createdAt,
      },
    });
    console.log(`Indexed note: ${note.title}`);
  }

  console.log("✅ All notes synced to OpenSearch");
  process.exit(0);
});
