// middlewares/uploadMiddleware.js

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// ✅ مرة واحدة بس
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getFolder = (fieldname) => {
  if (fieldname === "profilePic") return "profile-pics";
  if (fieldname === "medicalScan") return "medical-scans";
  return "general";
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: getFolder(file.fieldname),
    public_id: `${file.fieldname}-${Date.now()}`,
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  }),
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Images only"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

module.exports = upload;
