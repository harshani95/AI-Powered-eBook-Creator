const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
} = require("../controller/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Register route
router.post("/register", registerUser);
// Login route
router.post("/login", loginUser);
// Get user profile
router.get("/profile", protect, getUserProfile);
// Update user profile
router.put("/profile", protect, updateUserProfile);
module.exports = router;
