// routes/admin.js أو routes/dashboard.js
const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const authController = require("../controllers/authController"); const { protect, restrictTo } = require("../middlewares/authMiddleware");
// ========== Dashboard Routes ==========

router
  .route("/dashboard")
  .get(
    protect,
    restrictTo("admin"),
    adminController.getDashboard,
  );

router
  .route("/dashboard/stats/appointments")
  .get(
    protect,
    restrictTo("admin"),
    adminController.getAppointmentStats,
  );
router
  .route("/dashboard/filter")
  .get(
    protect,
    restrictTo("admin"),
    adminController.getFiltered,
  );

module.exports = router;

