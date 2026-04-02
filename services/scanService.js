const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../services/cloudinaryService");
const AppError = require("../utils/appError");

// ─── Storage خاص بالـ scans ──────────────────────────────────
const scanStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "medical-scans",
    public_id: `scan-${Date.now()}`,
  }),
});

// ─── 1. ميدل وير الرفع (تصدير مباشر) ──────────────────────────
exports.uploadScanImage = multer({
  storage: scanStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new AppError("يجب رفع صورة فقط", 400), false);
    }
  },
}).single("medicalScan");

// ─── AI Config ───────────────────────────────────────────────
const AI_BASE_URL = process.env.AI_BASE_URL;
const SCAN_ENDPOINTS = {
  skin: "/predict/skin",
  breast: "/predict/breast",
  eye: "/predict/eye",
  brain: "/predict/brain",
  heart: "/predict/heart",
  lung: "/predict/lung",
  kidney: "/predict/kidney",
};

// ─── 2. ميدل وير التحليل (تصدير مباشر) ────────────────────────
exports.analyzeScan = async (req, res, next) => {
  if (!req.file) return next(new AppError("Please upload an image", 400));

  const scanType = req.body.scanType;
  if (!scanType || !SCAN_ENDPOINTS[scanType])
    return next(new AppError("Invalid scan type", 400));

  try {
    const formData = new FormData();
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const aiResponse = await axios.post(
      `${AI_BASE_URL}${SCAN_ENDPOINTS[scanType]}`,
      formData,
      { headers: { ...formData.getHeaders() }, timeout: 60000 },
    );

    req.aiResult = aiResponse.data;
    req.aiStatus = "completed";
    next();
  } catch (err) {
    return next(new AppError("AI analysis failed, operation cancelled", 500));
  }
};

// exports.analyzeScan = async (req, res, next) => {
//   if (!req.file) return next(new AppError("برجاء رفع صورة", 400));

//   const scanType = req.body.scanType;
//   if (!scanType || !SCAN_ENDPOINTS[scanType]) {
//     if (req.file.filename) await cloudinary.uploader.destroy(req.file.filename);
//     return next(new AppError("نوع الفحص غير صالح", 400));
//   }

//   try {
//     const imageResponse = await axios.get(req.file.path, {
//       responseType: "arraybuffer",
//     });

//     const formData = new FormData();
//     formData.append("file", imageResponse.data, {
//       filename: req.file.originalname,
//       contentType: req.file.mimetype,
//     });

//     const aiResponse = await axios.post(
//       `${AI_BASE_URL}${SCAN_ENDPOINTS[scanType]}`,
//       formData,
//       {
//         headers: { ...formData.getHeaders() },
//         timeout: 30000,
//       },
//     );

//     req.aiResult = aiResponse.data;
//     req.aiStatus = "completed";
//     next();
//   } catch (err) {
//     if (req.file && req.file.filename) {
//       await cloudinary.uploader.destroy(req.file.filename);
//     }
//     return next(
//       new AppError("فشل تحليل الذكاء الاصطناعي، تم إلغاء العملية", 500),
//     );
//   }
// };
