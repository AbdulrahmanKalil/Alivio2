const dotenv = require("dotenv");
dotenv.config({ path: `${__dirname}/config.env` });
const mongoose = require("mongoose");
const runAdminSeed = require("./utils/adminSeeder");

const app = require("./app");

mongoose
  .connect(
    process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD),
  )
  .then(async () => {
    console.log("DB connection successful!");

    // ✅ Bootstrap Admin
    await runAdminSeed();
  })
  .catch((err) => {
    console.error("DB connection failed");
    console.error(err);
    process.exit(1);
  });

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
