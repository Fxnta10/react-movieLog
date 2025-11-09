const express = require("express");
const User = require("../models/User.js");
const router = express.Router();
const bcrypt = require("bcrypt");
const axios = require("axios");
const { generateToken, authenticateToken } = require("../middleware/auth");

const saltRounds = 10;
const api_key =
  process.env.OMDB_API_KEY || process.env.API_KEY || "your_omdb_api_key_here";

router.post("/login", async (req, res) => {
  //req.body = {email  , password}
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      // Generate JWT token
      const token = generateToken(user._id);

      return res.status(200).json({
        success: true,
        token: token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});

router.post("/register", async (req, res) => {
  //req.body={email,username,password}
  try {
    // Prevent duplicate registrations
    const existing = await User.findOne({ email: req.body.email });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }

    // generate salt and hash password
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashPassword = bcrypt.hashSync(req.body.password, salt);
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashPassword,
    });

    await newUser.save();
    return res
      .status(201)
      .json({ success: true, message: "User created successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error creating user" });
  }
});

router.get("/search", authenticateToken, async (req, res) => {
  try {
    const searchTerm = req.query.title;
    console.log("Search request received for:", searchTerm);
    console.log("API Key available:", api_key ? "Yes" : "No");

    if (!searchTerm || searchTerm.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "No search term provided",
      });
    }

    const omdbUrl = `https://www.omdbapi.com/?apikey=${api_key}&s=${searchTerm}`;
    console.log("Making request to OMDB:", omdbUrl);

    const response = await axios.get(omdbUrl);
    console.log("OMDB Response:", response.data);

    if (response.data.Response === "False") {
      return res.status(200).json({
        success: true,
        data: [],
        message: response.data.Error || "No movies found",
      });
    }

    res.status(200).json({
      success: true,
      data: response.data.Search || [],
    });
  } catch (err) {
    console.error("Search error:", err.message);
    console.error("Full error:", err);
    return res.status(500).json({
      success: false,
      error: "Something went wrong while fetching search results",
    });
  }
});

// Get movie details by IMDB ID - Protected route
router.get("/movie/:imdbID", authenticateToken, async (req, res) => {
  const { imdbID } = req.params;

  try {
    if (!imdbID) {
      return res.status(400).json({
        success: false,
        message: "IMDB ID is required",
      });
    }

    const url = `https://www.omdbapi.com/?apikey=${api_key}&i=${imdbID}`;
    const response = await axios.get(url);

    if (response.data.Response === "False") {
      return res.status(404).json({
        success: false,
        message: response.data.Error || "Movie not found",
      });
    }

    // Get user from DB using ID from token
    const user = await User.findById(req.user._id).lean();

    const watchedEntry = user?.watchedMovies?.find(
      (entry) => entry.movieID === imdbID
    );

    const isInWatchlist = user?.watchList?.includes(imdbID) || false;
    const isCurrentlyWatching =
      user?.currentlyWatching?.includes(imdbID) || false;

    const userData = watchedEntry
      ? {
          watched: true,
          review: watchedEntry.review || null,
          rating: watchedEntry.rating || null,
          liked: watchedEntry.liked || false,
          inWatchlist: isInWatchlist,
          isCurrentlyWatching: isCurrentlyWatching,
        }
      : {
          watched: false,
          review: null,
          rating: null,
          liked: false,
          inWatchlist: isInWatchlist,
          isCurrentlyWatching: isCurrentlyWatching,
        };

    return res.status(200).json({
      success: true,
      movie: response.data,
      user: userData,
    });
  } catch (err) {
    console.error("Movie fetch error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching movie details",
    });
  }
});

// Save/Update user review and rating for a movie - Protected route
router.post("/movie/:imdbID/review", authenticateToken, async (req, res) => {
  const { imdbID } = req.params;
  const { review, rating, liked } = req.body;

  try {
    if (!imdbID) {
      return res.status(400).json({
        success: false,
        message: "IMDB ID is required",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if movie already exists in watchedMovies
    const existingMovieIndex = user.watchedMovies.findIndex(
      (movie) => movie.movieID === imdbID
    );

    if (existingMovieIndex !== -1) {
      // Update existing entry - only update provided fields
      if (review !== undefined) {
        user.watchedMovies[existingMovieIndex].review = review;
      }
      if (rating !== undefined) {
        user.watchedMovies[existingMovieIndex].rating = rating;
      }
      if (liked !== undefined) {
        user.watchedMovies[existingMovieIndex].liked = liked;
      }
      user.watchedMovies[existingMovieIndex].movieStatus = "Watched";
    } else {
      // Add new entry
      const movieData = {
        movieID: imdbID,
        review: review || "",
        rating: rating || null,
        liked: liked || false,
        movieStatus: "Watched",
      };
      user.watchedMovies.push(movieData);
    }

    await user.save();

    // Return the updated movie data
    const updatedMovie = user.watchedMovies.find(
      (movie) => movie.movieID === imdbID
    );

    res.status(200).json({
      success: true,
      message: "Review saved successfully",
      data: {
        review: updatedMovie.review,
        rating: updatedMovie.rating,
        liked: updatedMovie.liked,
      },
    });
  } catch (err) {
    console.error("Save review error:", err);
    res.status(500).json({
      success: false,
      message: "Error saving review",
    });
  }
});

// Quick update for liked status - Protected route
router.patch("/movie/:imdbID/liked", authenticateToken, async (req, res) => {
  const { imdbID } = req.params;
  const { liked } = req.body;

  try {
    if (!imdbID) {
      return res.status(400).json({
        success: false,
        message: "IMDB ID is required",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if movie already exists in watchedMovies
    const existingMovieIndex = user.watchedMovies.findIndex(
      (movie) => movie.movieID === imdbID
    );

    if (existingMovieIndex !== -1) {
      // Update existing entry
      user.watchedMovies[existingMovieIndex].liked = liked;
    } else {
      // Create new entry with just liked status
      user.watchedMovies.push({
        movieID: imdbID,
        review: "",
        rating: null,
        liked: liked,
        movieStatus: "Watched",
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Liked status updated",
      data: { liked },
    });
  } catch (err) {
    console.error("Update liked error:", err);
    res.status(500).json({
      success: false,
      message: "Error updating liked status",
    });
  }
});

// Add/Remove movie from watchlist - Protected route
router.post(
  "/movie/:imdbID/addWatchlist",
  authenticateToken,
  async (req, res) => {
    const { imdbID } = req.params;
    const { changeTo } = req.body; // true to add, false to remove

    try {
      if (!imdbID) {
        return res.status(400).json({
          success: false,
          message: "IMDB ID is required",
        });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const isInWatchlist = user.watchList.includes(imdbID);

      if (changeTo && !isInWatchlist) {
        // Add to watchlist
        user.watchList.push(imdbID);
      } else if (!changeTo && isInWatchlist) {
        // Remove from watchlist
        user.watchList = user.watchList.filter((id) => id !== imdbID);
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: changeTo ? "Added to watchlist" : "Removed from watchlist",
        inWatchlist: changeTo,
      });
    } catch (err) {
      console.error("Watchlist update error:", err);
      res.status(500).json({
        success: false,
        message: "Error updating watchlist",
      });
    }
  }
);

// Add/Remove movie from currently watching - Protected route
router.post(
  "/movie/:imdbID/addCurrentlyWatching",
  authenticateToken,
  async (req, res) => {
    const { imdbID } = req.params;
    const { changeTo } = req.body; // true to add, false to remove

    try {
      if (!imdbID) {
        return res.status(400).json({
          success: false,
          message: "IMDB ID is required",
        });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const isCurrentlyWatching = user.currentlyWatching.includes(imdbID);

      if (changeTo && !isCurrentlyWatching) {
        // Add to currently watching
        user.currentlyWatching.push(imdbID);
      } else if (!changeTo && isCurrentlyWatching) {
        // Remove from currently watching
        user.currentlyWatching = user.currentlyWatching.filter(
          (id) => id !== imdbID
        );
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: changeTo
          ? "Added to currently watching"
          : "Removed from currently watching",
        isCurrentlyWatching: changeTo,
      });
    } catch (err) {
      console.error("Currently watching update error:", err);
      res.status(500).json({
        success: false,
        message: "Error updating currently watching",
      });
    }
  }
);

// Get current user - Protected route
router.get("/me", authenticateToken, async (req, res) => {
  try {
    // req.user is attached by authenticateToken middleware
    const user = await User.findById(req.user._id);
    res.status(200).json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching user data",
    });
  }
});

router.get("/card/:imdbID", async (req, res) => {
  const { imdbID } = req.params;

  if (imdbID) {
    try {
      const omdbUrl = `https://www.omdbapi.com/?apikey=${api_key}&i=${imdbID}`;
      const response = await axios.get(omdbUrl);
      res.status(200).json(response.data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Error occured..." });
    }
  }
});

module.exports = router;