const express = require("express");
const doctorController = require("../controllers/doctorController");
const authController = require("../controllers/authController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");
const appointmentRouter = require("./appointmentRoutes");
const validate = require("../middlewares/validationMiddleware");
const { updateDoctorSchema } = require("../utils/validators/doctorValidator");

const { signupDoctorSchema } = require("../utils/validators/userValidator");
const { doctorIdSchema } = require("../utils/validators/doctorValidator");

const router = express.Router();

// // create doctor profile
// router.post(
//   "/create",
//   protect,
//   restrictTo("admin"),
//   validate(updateDoctorSchema),
//   doctorController.createDoctor,
//);

router.post(
  "/createDoctor",
  // validate(signupDoctorSchema),
  doctorController.createDoctor,
);

// All doctors
router
  .route("/")
  .get(protect, restrictTo("admin", "patient"), doctorController.getAllDoctors);

router.get("/me", protect, restrictTo("doctor"), doctorController.getMyProfile);

router.use("/:doctorId/appointments", appointmentRouter);

// Single doctor
router
  .route("/:id")
  .get(
    validate(doctorIdSchema),
    protect,
    restrictTo("doctor", "patient", "admin"),
    doctorController.getDoctor,
  )
  .patch(
    validate(updateDoctorSchema),
    protect,
    restrictTo("doctor"),
    doctorController.updateDoctor,
  );
// .delete(
//   validate(doctorIdSchema),
//   protect,
//   doctorController.deleteDoctor,
// );

// router.get(
//   "/:id/schedule",
//   validate(doctorIdSchema),
//   protect,
//   doctorController.getDoctorSchedule,
// );

module.exports = router;
