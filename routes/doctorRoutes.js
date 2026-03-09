const express = require("express");
const doctorController = require("../controllers/doctorController");
const authController = require("../controllers/authController");
const appointmentRouter = require("./appointmentRoutes");
const validate = require("../middlewares/validationMiddleware");
const { updateDoctorSchema } = require("../utils/validators/doctorValidator");

const { doctorIdSchema } = require("../utils/validators/doctorValidator");

const router = express.Router();
// All doctors
router
  .route("/")
  .get(
    authController.protect,
    authController.restrictTo("admin", "patient"),
    doctorController.getAllDoctors,
  );

router.get(
  "/me",
  authController.protect,
  authController.restrictTo("doctor"),
  doctorController.getMyProfile,
);

router.use("/:doctorId/appointments", appointmentRouter);

// Single doctor
router
  .route("/:id")
  .get(
    validate(doctorIdSchema),
    authController.protect,
    authController.restrictTo("doctor", "patient", "admin"),
    doctorController.getDoctor,
  )
  .patch(
    validate(updateDoctorSchema),
    authController.protect,
    authController.restrictTo("doctor"),
    doctorController.updateDoctor,
  );
// .delete(
//   validate(doctorIdSchema),
//   authController.protect,
//   doctorController.deleteDoctor,
// );

// router.get(
//   "/:id/schedule",
//   validate(doctorIdSchema),
//   authController.protect,
//   doctorController.getDoctorSchedule,
// );

module.exports = router;
