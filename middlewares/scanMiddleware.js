// middlewares/scanMiddleware.js

const axios = require("axios");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const AppError = require("../utils/appError");

// ─── Storage خاص بالـ scans بدون ضغط ───────────────────────────
const scanStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "medical-scans",
    public_id: `scan-${Date.now()}`,
    // مفيش transformation عشان الـ AI يشوف الصورة بجودة عالية
  }),
});

// middleware 1 — رفع الصورة على Cloudinary
const uploadScanImage = multer({
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

// ─── AI Config ───────────────────────────────────────────────────
const AI_BASE_URL = "https://morefaat69-medical-ai-api.hf.space";

const SCAN_ENDPOINTS = {
  skin: "/predict/skin",
  breast: "/predict/breast",
  eye: "/predict/eye",
  brain: "/predict/brain",
  heart: "/predict/heart",
  lung: "/predict/lung",
  kidney: "/predict/kidney",
};

// middleware 2 — إرسال الصورة للـ AI
const analyzeScan = async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("برجاء رفع صورة", 400));
  }

  const scanType = req.body.scanType;
  if (!scanType || !SCAN_ENDPOINTS[scanType]) {
    return next(
      new AppError(
        `نوع الفحص غير صالح. المتاح: ${Object.keys(SCAN_ENDPOINTS).join(", ")}`,
        400,
      ),
    );
  }

  try {
    const aiResponse = await axios.post(
      `${AI_BASE_URL}${SCAN_ENDPOINTS[scanType]}`,
      { image_url: req.file.path },
      { timeout: 30000 },
    );

    req.aiResult = aiResponse.data;
    req.aiStatus = "completed";
  } catch (err) {
    console.error("AI ERROR:", err.response?.data || err.message);
    req.aiResult = null;
    req.aiStatus = "failed";
    req.aiError = err.response?.data?.message || "AI processing failed";
  }

  next();
};

module.exports = { uploadScanImage, analyzeScan };
