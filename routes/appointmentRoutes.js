const express = require("express");

const authController = require("../controllers/authController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");
const appointmentController = require("../controllers/appointmentController");

const router = express.Router({ mergeParams: true });

router.post(
  "/",
  protect,
  restrictTo("patient", "admin"),
  appointmentController.setDoctorId,
  appointmentController.bookAppointment,
);

// All Appointment
router
  .route("/")
  .get(protect, restrictTo("admin"), appointmentController.getAllAppointments);

router.get(
  "/my-appointments",
  protect,
  restrictTo("doctor", "patient"),
  appointmentController.getMyAppointments,
);

router.get(
  "/:id",
  protect,
  restrictTo("doctor", "admin"),
  appointmentController.getAppointment,
);

router.patch(
  "/:id/status",
  protect,
  restrictTo("doctor"),
  appointmentController.cancelAppointmentByDoctor,
);
router.patch(
  "/:id/cancel",
  protect,
  restrictTo("patient"),
  appointmentController.cancelAppointmentByPatient,
);
router.get(
  "/appointments/:appointmentId/scans",
  protect,
  restrictTo("doctor"),
  appointmentController.getPatientScansForDoctor,
);

module.exports = router;
