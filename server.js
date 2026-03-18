const dotenv = require("dotenv");
dotenv.config({ path: `${__dirname}/config.env` });

const mongoose = require("mongoose");
const runAdminSeed = require("./utils/adminSeeder");
const app = require("./app");

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  await mongoose.connect(
    process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD),
  );

  isConnected = true;
  console.log("DB connection successful!");
  await runAdminSeed();
}

// ✅ Local Development
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 4000;
  connectDB().then(() => {
    app.listen(port, () => {
      console.log(`App running on port ${port}...`);
    });
  });
}

// ✅ Vercel Serverless
module.exports = async (req, res) => {
  await connectDB();
  app(req, res);
};
