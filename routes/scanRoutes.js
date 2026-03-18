const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const {
  uploadScanImage,
  analyzeScan,
} = require("../middlewares/scanMiddleware");
const scanController = require("../controllers/scanController");

// كل الـ routes محتاجة login
router.use(authController.protect);

// POST /api/v1/scans  ← رفع وتحليل صورة
// GET  /api/v1/scans  ← جلب كل فحوصاتك

router
  .route("/")
  .get(scanController.getMyScan)
  .post(
    (req, res, next) => {
      console.log("FILE:", req.file);
      console.log("BODY:", req.body);
      next();
    },
    uploadScanImage,
    analyzeScan,
    scanController.uploadScan,
  );
// .post(uploadScanImage, analyzeScan, scanController.uploadScan);

// GET    /api/v1/scans/:id  ← جلب فحص معين
// DELETE /api/v1/scans/:id  ← حذف فحص
router
  .route("/:id")
  .get(scanController.getScan)
  .delete(scanController.deleteScan);

module.exports = router;
