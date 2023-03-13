const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: "./config.env" });
const app = require("./app");

// DATABASE CONFIG
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((_con) => console.log("DB connection successful !!"));

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
);

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION 💥 Shutting Down");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION 💥 Shutting Down");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
