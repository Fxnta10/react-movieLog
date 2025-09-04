const express = require("express");
const User = require("../models/User.js");
const router = express.Router();
const bcrypt = require("bcrypt");

const saltRounds = 10;

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

module.exports = router;
