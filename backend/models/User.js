const mongoose = require("mongoose");
const watchedListSchema = require("./WatchedList.js");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  watchList: [String], // oMDB IDs
  watchedMovies: [watchedListSchema], // embedding schema, not model
  currentlyWatching: [String],
  likedList: [String],
});

const User = mongoose.model("User", userSchema);
module.exports = User;
