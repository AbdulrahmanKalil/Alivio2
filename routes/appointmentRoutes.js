const express = require("express");

const authController = require("../controllers/authController");
const appointmentController = require("../controllers/appointmentController");

const router = express.Router({ mergeParams: true });

router.post(
  "/",
  authController.protect,
  authController.restrictTo("patient", "admin"),
  appointmentController.setDoctorId,
  appointmentController.bookAppointment,
);

// All Appointment
router
  .route("/")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    appointmentController.getAllAppointments,
  );

router.get(
  "/my-appointments",
  authController.protect,
  authController.restrictTo("doctor", "patient"),
  appointmentController.getMyAppointments,
);

router.patch(
  "/:id/status",
  authController.protect,
  authController.restrictTo("doctor"),
  appointmentController.cancelAppointmentByDoctor,
);
router.patch(
  "/:id/cancel",
  authController.protect,
  authController.restrictTo("patient"),
  appointmentController.cancelAppointmentByPatient,
);

module.exports = router;
