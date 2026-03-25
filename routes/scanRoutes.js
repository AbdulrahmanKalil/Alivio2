const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const scanController = require("../controllers/scanController");
const {
  uploadScanImage,
  analyzeScan,
} = require("../middlewares/scanMiddleware");

router.use(authController.protect);

router
  .route("/")
  .get(scanController.getMyScan) // جلب الفحوصات
  .post(uploadScanImage, analyzeScan, scanController.uploadScan);

router
  .route("/:id")
  .get(scanController.getScan)
  .delete(scanController.deleteScan);

module.exports = router;
