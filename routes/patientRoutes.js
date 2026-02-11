/* eslint-disable no-undef */
const express = require("express");

const authController = require("../controllers/authController");
const patientController = require("../controllers/patientController");
const { updatePatientSchema } = require("../utils/validators/patientSchema");
const validate = require("../middlewares/validationMiddleware");
const { patientIdSchema } = require("../utils/validators/patientSchema");

const router = express.Router();

router.route("/").get(authController.protect, patientController.getAllPatient);

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
    authController.restrictTo("doctor"),
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
    authController.restrictTo("doctor"),
    patientController.deletePatient,
  );

module.exports = router;
