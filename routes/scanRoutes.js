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

// في ملف الـ Routes
router.route("/").get(scanController.getMyScan);
router
  .route("/")
  .get(scanController.getMyScan)
  .post(
    uploadScanImage, // استدعاء مباشر لأنه جاهز
    (req, res, next) => {
      // الـ logs دي مهمة جداً للتأكد من نجاح الرفع لـ Cloudinary
      console.log("FILE FROM CLOUDINARY:", req.file ? req.file.path : "NULL");
      console.log("BODY DATA:", req.body);
      next();
    },
    analyzeScan,
    scanController.uploadScan,
  );

module.exports = router;
