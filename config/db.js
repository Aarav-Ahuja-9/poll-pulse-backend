const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    const userCollection = conn.connection.collection("users");
    try {
      const indexes = await userCollection.indexes();
      if (indexes.some((index) => index.name === "username_1")) {
        await userCollection.dropIndex("username_1");
        console.log("Dropped stale username index from users collection.");
      }
    } catch (indexError) {
      if (indexError.codeName !== "IndexNotFound") {
        console.warn("Unable to drop username index:", indexError.message);
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
