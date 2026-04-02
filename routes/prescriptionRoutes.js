const express = require("express");
const authController = require("../controllers/authController"); const { protect, restrictTo } = require("../middlewares/authMiddleware");
const prescriptionController = require("../controllers/prescriptionController");

const router = express.Router();

router
  .route("/")
  .get(
    protect,
    restrictTo("admin"),
    prescriptionController.getAllPrescriptions,
  );

router.get(
  "/my-prescriptions",
  protect,
  restrictTo("doctor", "patient"),
  prescriptionController.getPrescription,
);

router.get(
  "/appointments/:appointmentId/prescription",
  protect,
  restrictTo("doctor", "patient"),
  prescriptionController.getPrescriptionByAppointmentId,
);

router.post(
  "/:appointmentId/prescription",
  protect,
  restrictTo("doctor"),
  prescriptionController.createPrescription,
);

router.patch(
  "/:prescriptionId",
  protect,
  restrictTo("doctor"),
  prescriptionController.updatePrescription,
);

module.exports = router;

