const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Scan = require("../models/scanModel");
const cloudinary = require("../services/cloudinaryService");
const Patient = require("../models/patientModel");
const User = require("../models/userModel");
const Appointment = require("../models/appointmentModel");
const Doctor = require("../models/doctorModel");

// 1. رفع صورة وتحليلها بالـ AI
exports.uploadScan = catchAsync(async (req, res, next) => {
  if (!req.aiResult || req.aiStatus !== "completed") {
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    return next(
      new AppError(req.aiError || "فشل تحليل الصورة، لم يتم حفظ البيانات", 422),
    );
  }

  const scan = await Scan.create({
    imageUrl: req.file.path,
    publicId: req.file.filename,
    scanType: req.body.scanType,
    aiResult: req.aiResult,
    status: "completed",
    notes: req.body.notes ?? null,
    user: req.user.id,
    patient: req.user.patientId, // ← هنا التغيير
  });

  res.status(201).json({
    status: "success",
    message: "تم تحليل الصورة وحفظها بنجاح",
    data: { scan },
  });
});

// 2. جلب كل فحوصات المستخدم
exports.getMyScan = catchAsync(async (req, res, next) => {
  const scans = await Scan.find({ user: req.user.id }).sort("-createdAt");
  res.status(200).json({
    status: "success",
    results: scans.length,
    data: { scans },
  });
});

// 3. حذف فحص (مع مسح الصورة من Cloudinary)
exports.deleteScan = catchAsync(async (req, res, next) => {
  const scan = await Scan.findById(req.params.id);

  if (!scan) return next(new AppError("لم يتم العثور على الفحص", 404));
  if (scan.user.toString() !== req.user.id)
    return next(new AppError("غير مصرح لك بحذف هذا الفحص", 403));

  // مسح الصورة من Cloudinary لتوفير مساحة
  if (scan.publicId) {
    await cloudinary.uploader.destroy(scan.publicId);
  }

  await scan.deleteOne();
  res.status(204).json({ status: "success", data: null });
});

// الدكتور يشوف scan مريض عنده appointment معاه
exports.getDoctorScan = catchAsync(async (req, res, next) => {
  const scan = await Scan.findById(req.params.id);

  if (!scan) {
    return next(new AppError("لم يتم العثور على هذا الفحص", 404));
  }

  // تحقق إن الدكتور عنده appointment مع صاحب الـ scan
  const appointment = await Appointment.findOne({
    doctor: req.user.doctorId,
    patient: scan.patient,
  });

  if (!appointment) {
    return next(new AppError("ليس لديك صلاحية لعرض هذا الفحص", 403));
  }

  res.status(200).json({
    status: "success",
    data: { scan },
  });
});
exports.addDoctorNotes = catchAsync(async (req, res, next) => {
  const scan = await Scan.findByIdAndUpdate(
    req.params.id,
    {
      notes: req.body.notes,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!scan) {
    return next(new AppError("Scan not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { scan },
  });
});
