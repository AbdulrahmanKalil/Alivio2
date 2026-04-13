/* eslint-disable no-undef */
const express = require("express");

const authController = require("../controllers/authController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");
const patientController = require("../controllers/patientController");
const { updatePatientSchema } = require("../utils/validators/patientValidator");
const validate = require("../middlewares/validationMiddleware");
const { patientIdSchema } = require("../utils/validators/patientValidator");

const router = express.Router();

router
  .route("/")
  .get(protect, restrictTo("admin"), patientController.getAllPatients);

router.get(
  "/my-patients",
  protect,
  restrictTo("doctor"),
  patientController.getMyPatients,
);

router.get(
  "/:id/MedicalHistory",
  protect,
  restrictTo("patient", "doctor"),
  patientController.getmedicalHistory,
);

router.get(
  "/me",
  protect,
  restrictTo("patient"),
  patientController.getMyProfile,
);
router
  .route("/:id")
  .get(
    validate(patientIdSchema),
    protect,
    restrictTo("admin"),
    patientController.getPatient,
  )
  .patch(
    validate(updatePatientSchema),
    protect,
    restrictTo("patient"),
    patientController.updatePatient,
  )
  .delete(
    validate(patientIdSchema),
    protect,
    restrictTo("admin"),
    patientController.deletePatient,
  );

module.exports = router;
