const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");

dotenv.config();

const port = process.env.PORT || 4000;
const mongoDBURL = process.env.MONGODB_URL || "";

const app = express();

const loginRouter = require("./routes/loginRoute");
// const userRouter = require("./routes/userRoutes");

app.use(express.json());
app.use(cors());

app.use("/api", loginRouter);
// app.use("/api", userRouter);

app.get("/", (request, response) => {
  console.log(request);
  return response.status(234).send("Testing Routes ");
});

mongoose
  .connect(mongoDBURL)
  .then(() => {
    console.log("App connected to database");
    app.listen(port, () => {
      console.log(`App is listening to port: ${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
