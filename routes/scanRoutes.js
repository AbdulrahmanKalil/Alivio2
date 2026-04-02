const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middlewares/authMiddleware");
const scanController = require("../controllers/scanController");

const chatService = require("../services/chatService");
const { uploadScanImage, analyzeScan } = require("../services/scanService");

router.post("/chat", chatService.chatWithModel);
router.use(protect);

router
  .route("/")
  .get(scanController.getMyScan) // جلب الفحوصات
  .post(uploadScanImage, analyzeScan, scanController.uploadScan);

router
  .route("/:id")
  .get(scanController.getScan)
  .delete(scanController.deleteScan);

module.exports = router;
