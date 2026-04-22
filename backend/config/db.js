const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;
    const dbName = process.env.DB_NAME;
    const atlasUri = (dbUser && dbPassword && dbName)
      ? `mongodb+srv://${dbUser}:${encodeURIComponent(dbPassword)}@cluster0.xqltkqh.mongodb.net/${dbName}?retryWrites=true&w=majority`
      : process.env.MONGO_URI;

    if (!atlasUri) {
      throw new Error('Missing MongoDB configuration. Set DB_USER, DB_PASSWORD, DB_NAME (or MONGO_URI).');
    }

    const conn = await mongoose.connect(atlasUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
