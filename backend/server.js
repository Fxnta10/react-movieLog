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

// Detailed connection logging
console.log("MongoDB URL defined:", !!mongoDBURL);
if (!mongoDBURL) {
  console.error("ERROR: MONGODB_URL is not set in .env or environment");
  console.error("Please add MONGODB_URL to backend/.env file");
  process.exit(1);
}

console.log("Attempting to connect to MongoDB...");

const connectDB = async () => {
  try {
    await mongoose.connect(mongoDBURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ App connected to database");
    app.listen(port, () => {
      console.log(`✓ App is listening to port: ${port}`);
    });
  } catch (error) {
    console.error("✗ MongoDB Connection Error:");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error:", error);
    console.error("\nTroubleshooting tips:");
    console.error("1. Check if MONGODB_URL is correct in backend/.env");
    console.error("2. Ensure MongoDB database name is included in URL");
    console.error("3. Check MongoDB Atlas IP whitelist includes your machine");
    console.error(
      "4. Verify username/password in connection string are correct"
    );

    // Retry after 5 seconds
    console.log("\nRetrying in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

connectDB();
