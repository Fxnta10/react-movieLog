const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

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

// Serve static files from the React frontend app
const frontendPath = path.resolve(__dirname, "../frontend/dist");
console.log("Serving static files from:", frontendPath);
app.use(express.static(frontendPath));

// After defining your routes, anything that doesn't match a route should be sent to the frontend
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  const indexPath = path.join(frontendPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("Error sending index.html:", err);
      res
        .status(500)
        .send(
          "Error loading frontend. Make sure you have run 'npm run build' in the frontend directory."
        );
    }
  });
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
    console.error("MongoDB Connection Error:");
    // Retry after5 seconds
    console.log("\nRetrying in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

connectDB();
