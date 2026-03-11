/* eslint-disable no-undef */
const express = require("express");

const authController = require("../controllers/authController");
const patientController = require("../controllers/patientController");
const { updatePatientSchema } = require("../utils/validators/patientValidator");
const validate = require("../middlewares/validationMiddleware");
const { patientIdSchema } = require("../utils/validators/patientValidator");

const router = express.Router();

router
  .route("/")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    patientController.getAllPatients,
  );

router.get(
  "/my-patients",
  authController.protect,
  authController.restrictTo("doctor"),
  patientController.getMyPatients,
);

router.get(
  "/me",
  authController.protect,
  authController.restrictTo("patient"),
  patientController.getMyProfile,
);
router
  .route("/:id")
  .get(
    validate(patientIdSchema),
    authController.protect,
    authController.restrictTo("admin"),
    patientController.getPatient,
  )
  .patch(
    validate(updatePatientSchema),
    authController.protect,
    authController.restrictTo("patient"),
    patientController.updatePatient,
  )
  .delete(
    validate(patientIdSchema),
    authController.protect,
    authController.restrictTo("admin"),
    patientController.deletePatient,
  );

module.exports = router;
