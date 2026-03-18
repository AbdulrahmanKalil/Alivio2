const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Scan = require("../models/scanModel");

// رفع صورة وتحليلها بالـ AI
exports.uploadScan = catchAsync(async (req, res, next) => {
  if (!req.user) return next(new AppError("يجب تسجيل الدخول أولاً", 401));

  const scan = await Scan.create({
    imageUrl: req.file.path,
    publicId: req.file.filename,
    scanType: req.body.scanType,
    aiResult: req.aiResult, // جاي من analyzeScan middleware
    status: req.aiStatus, // جاي من analyzeScan middleware
    errorMessage: req.aiError, // جاي من analyzeScan middleware
    user: req.user.id,
  });

  res.status(scan.status === "completed" ? 201 : 207).json({
    status: "success",
    message:
      scan.status === "completed"
        ? "تم تحليل الصورة بنجاح"
        : "تم رفع الصورة ولكن فشل التحليل",
    data: { scan },
  });
});

// جلب كل فحوصات المستخدم
exports.getMyScan = catchAsync(async (req, res, next) => {
  const scans = await Scan.find({ user: req.user.id }).sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: scans.length,
    data: { scans },
  });
});

// جلب فحص واحد بالـ ID
exports.getScan = catchAsync(async (req, res, next) => {
  const scan = await Scan.findById(req.params.id);

  if (!scan) return next(new AppError("لم يتم العثور على الفحص", 404));

  if (scan.user.toString() !== req.user.id)
    return next(new AppError("غير مصرح لك بمشاهدة هذا الفحص", 403));

  res.status(200).json({
    status: "success",
    data: { scan },
  });
});

// حذف فحص
exports.deleteScan = catchAsync(async (req, res, next) => {
  const scan = await Scan.findById(req.params.id);

  if (!scan) return next(new AppError("لم يتم العثور على الفحص", 404));

  if (scan.user.toString() !== req.user.id)
    return next(new AppError("غير مصرح لك بحذف هذا الفحص", 403));

  await scan.deleteOne();

  res.status(204).json({ status: "success", data: null });
});
