const mongoose = require("mongoose");
require("dotenv").config();

(async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    const coll = conn.connection.collection("users");
    const indexes = await coll.indexes();
    console.log(JSON.stringify(indexes, null, 2));
    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
