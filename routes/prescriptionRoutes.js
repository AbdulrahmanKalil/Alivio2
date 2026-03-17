const express = require("express");
const authController = require("../controllers/authController");
const prescriptionController = require("../controllers/PrescriptionController");

const router = express.Router();

router
  .route("/")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    prescriptionController.getAllPrescriptions,
  );

router.get(
  "/my-prescriptions",
  authController.protect,
  authController.restrictTo("doctor", "patient"),
  prescriptionController.getPrescription,
);

router.get(
  "/appointments/:appointmentId/prescription",
  authController.protect,
  authController.restrictTo("doctor", "patient"),
  prescriptionController.getPrescriptionByAppointmentId,
);

router.post(
  "/:appointmentId/prescription",
  authController.protect,
  authController.restrictTo("doctor"),
  prescriptionController.createPrescription,
);

router.patch(
  "/:prescriptionId",
  authController.protect,
  authController.restrictTo("doctor"),
  prescriptionController.updatePrescription,
);

module.exports = router;
