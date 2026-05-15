const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  console.log("Signup Request Received:", req.body);
  try {
    const { username, name, email, password } = req.body;
    const userName = username || name;

    if (!userName || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const user = await User.create({ name: userName, email, password });

    console.log("User successfully created in DB:", user.name);

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      message: "User created successfully!",
    });
  } catch (err) {
    console.error("Signup Error:", err.message);
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Duplicate field value",
        error: err.message,
      });
    }
    return res.status(400).json({
      message: "User creation failed",
      error: err.message,
    });
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      return res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
        message: "Login successful!",
      });
    } else {
      return res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    console.error("Login Error:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

module.exports = { registerUser, loginUser };
