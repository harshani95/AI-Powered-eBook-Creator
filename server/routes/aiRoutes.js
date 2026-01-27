const express = require("express");
const router = express.Router();
const {
  generateBookOutline,
  generateChapterContent,
} = require("../controller/aiController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/generate-outline", generateBookOutline);
router.post("/generate-chapter-content", generateChapterContent);

module.exports = router;
