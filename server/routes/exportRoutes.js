const express = require("express");
const router = express.Router();
const {
  exportAsDocument,
  exportAsPDF,
} = require("../controller/exportController");
const { protect } = require("../middleware/authMiddleware");

router.get("/:id/pdf", protect, exportAsPDF);
router.get("/:id/document", protect, exportAsDocument);
module.exports = router;
