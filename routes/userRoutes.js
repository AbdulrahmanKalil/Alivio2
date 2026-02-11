const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const validate = require("../middlewares/validationMiddleware");
const { signupDoctorSchema } = require("../utils/validators/userSchema");
const { signupPatientSchema } = require("../utils/validators/userSchema");

const { updateUserSchema } = require("../utils/validators/userSchema");

const router = express.Router();

router.post(
  "/signup/patient",
  validate(signupPatientSchema),
  authController.signupPatient,
);

router.post(
  "/signup/doctor",
  validate(signupDoctorSchema),
  authController.signupDoctor,
);

router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch(
  "/resetPassword/:token",
  validate(updateUserSchema),
  authController.resetPassword,
);

router.route("/").get(userController.getAllUsers);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
