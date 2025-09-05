const express = require("express");
const User = require("../models/User.js");
const router = express.Router();
const bcrypt = require("bcrypt");
const axios = require("axios");

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
      return res.status(500).json({ success: false });
    }
    const passwordMatch = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (passwordMatch) {
      return res.status(200).json({ success: true });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

router.post("/register", async (req, res) => {
  //req.body={email,username,password}
  try {
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

router.get("/search", async (req, res) => {
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

module.exports = router;
