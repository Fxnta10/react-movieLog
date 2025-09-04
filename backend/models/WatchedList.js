const mongoose = require("mongoose");

const watchedListSchema = new mongoose.Schema({
  movieID: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
  },
  review: {
    type: String,
  },
  movieStatus: {
    type: String, // e.g., "Watched", "CurrentlyWatching", "WatchList"
  },
  liked: {
    type: Boolean,
  },
});

module.exports = watchedListSchema; // export schema, not model
