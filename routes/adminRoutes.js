// routes/admin.js أو routes/dashboard.js
const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const authController = require("../controllers/authController");
// ========== Dashboard Routes ==========

router
  .route("/dashboard")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    adminController.getDashboard,
  );

router
  .route("/dashboard/stats/appointments")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    adminController.getAppointmentStats,
  );
router
  .route("/dashboard/filter")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    adminController.getFiltered,
  );

module.exports = router;
