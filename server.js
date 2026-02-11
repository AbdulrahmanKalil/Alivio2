const dotenv = require("dotenv");
const mongoose = require("mongoose");

require("dotenv").config({ path: "./config.env", quiet: true });

const app = require("./app");

mongoose
  .connect(
    process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD),
  )
  // eslint-disable-next-line no-console
  .then(() => console.log("DB connection successful!"))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("DB connection failed");
    process.exit(1);
  });

const port = process.env.PORT || 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`App running on port ${port}...`);
});
