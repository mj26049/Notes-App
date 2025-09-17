const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Note = require("./models/Note");
const User = require("./models/User");

dotenv.config();

const start = async () => {
  try {
    // connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    // find a user (so notes can belong to someone)
    const user = await User.findOne();
    if (!user) {
      console.log("❌ No users found. Please register a user first.");
      process.exit(1);
    }

    // prepare 10 notes
    const notesData = [];
    for (let i = 1; i <= 10; i++) {
      notesData.push({
        title: `Test Note ${i}`,
        content: `This is the content of test note ${i}.`,
        tags: ["test", i % 2 === 0 ? "even" : "odd"],
        user: user._id,
      });
    }

    // insert into MongoDB
    await Note.insertMany(notesData);
    console.log("✅ 10 notes inserted into MongoDB");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding notes:", error);
    process.ex
    it(1);
  }
};

start();
