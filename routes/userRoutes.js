const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const upload = require("../middlewares/uploadMiddleware");

const validate = require("../middlewares/validationMiddleware");
const { signupDoctorSchema } = require("../utils/validators/userValidator");
const { signupPatientSchema } = require("../utils/validators/userValidator");
const { updateUserSchema } = require("../utils/validators/userValidator");
const { resetPasswordSchema } = require("../utils/validators/userValidator");

const router = express.Router();

// ───────── Upload Routes ─────────
router.patch(
  "/updatePhoto",
  authController.protect,
  upload.single("profilePic"),
  userController.updatePhoto,
);

// ───────── Auth Routes ─────────
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
  validate(resetPasswordSchema),
  authController.resetPassword,
);

// ───────── User CRUD ─────────
router.route("/").get(userController.getAllUsers);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
