const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const scanController = require("../controllers/scanController");
const {
  uploadScanImage,
  analyzeScan,
} = require("../middlewares/scanMiddleware");

// 1) حماية كل المسارات
router.use(authController.protect);

// 2) تعريف المسارات
router
  .route("/")
  .get(scanController.getMyScan) // جلب الفحوصات
  .post(
    uploadScanImage,
    (req, res, next) => {
      console.log("FILE FROM CLOUDINARY:", req.file ? req.file.path : "NULL");
      next();
    },
    analyzeScan,
    scanController.uploadScan, // تأكد أن الاسم مطابق للي في الـ Controller
  );

// 3) مسارات الـ ID (لو محتاجها)
router
  .route("/:id")
  .get(scanController.getScan)
  .delete(scanController.deleteScan);

module.exports = router;
