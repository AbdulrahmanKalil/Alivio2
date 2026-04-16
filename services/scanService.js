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

// ─── 1. ميدل وير الرفع ────────────────────────────────────────
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

// ─── 2. ميدل وير التحليل ─────────────────────────────────────
exports.analyzeScan = async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please upload an image", 400));
  }

  const scanType = req.body.scanType;
  if (!scanType || !SCAN_ENDPOINTS[scanType]) {
    return next(new AppError("Invalid scan type", 400));
  }

  try {
    // 🧠 1. تحميل الصورة من Cloudinary كـ buffer
    const imageResponse = await axios.get(req.file.path, {
      responseType: "arraybuffer",
    });

    // 🧠 2. تحويلها لـ form-data
    const formData = new FormData();
    formData.append("file", imageResponse.data, {
      filename: req.file.originalname || "scan.jpg",
      contentType: req.file.mimetype,
    });

    // 🧠 3. إرسالها للـ AI
    const aiResponse = await axios.post(
      `${AI_BASE_URL}${SCAN_ENDPOINTS[scanType]}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 60000,
      },
    );

    // 🧠 4. حفظ النتيجة
    req.aiResult = aiResponse.data;
    req.aiStatus = "completed";

    next();
  } catch (err) {
    // 🔥 logging حقيقي مش وهمي
    console.error("🔥 AI ERROR:");
    console.error("Message:", err.message);
    console.error("Response:", err.response?.data);

    return next(
      new AppError(
        err.response?.data?.message || err.message || "AI analysis failed",
        500,
      ),
    );
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
