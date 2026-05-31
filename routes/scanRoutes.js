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

router.get("/doctor/:id", protect, scanController.getDoctorScan);
router.patch(
  "/:id/notes",
  protect,
  restrictTo("doctor"),
  scanController.addDoctorNotes,
);

router.route("/:id").delete(scanController.deleteScan);

module.exports = router;
