const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), "config.env") });

const cloudinary = require("cloudinary").v2;
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModel");

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};

exports.updatePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("برجاء رفع صورة", 400));
  }

  // جيب اليوزر عشان تشوف الصورة القديمة
  const user = await User.findById(req.user.id);

  // امسح الصورة القديمة من Cloudinary لو موجودة
  if (user.profilePic && user.profilePic.public_id) {
    await cloudinary.uploader.destroy(user.profilePic.public_id);
  }

  // حفظ الصورة الجديدة
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      profilePic: {
        url: req.file.path,
        public_id: req.file.filename,
      },
    },
    { new: true },
  );

  res.status(200).json({
    status: "success",
    data: { user: updatedUser },
  });
});

exports.uploadScan = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("برجاء رفع صورة", 400));
  }

  res.status(200).json({
    status: "success",
    url: req.file.path,
    public_id: req.file.filename,
  });
});
