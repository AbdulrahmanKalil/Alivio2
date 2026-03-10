const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

const runAdminSeed = async () => {
  try {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.warn(
        "⚠️ Admin seed skipped: missing ADMIN_EMAIL or ADMIN_PASSWORD",
      );

      return;
    }

    const adminExists = await User.findOne({
      email: process.env.ADMIN_EMAIL,
    });

    if (adminExists) return;

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

    await User.create({
      name: "System Admin",
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      passwordConfirm: hashedPassword,
      role: "admin",
    });

    console.log("✅ Admin account seeded successfully.");
  } catch (err) {
    console.error("❌ Admin seed failed:", err.message);
  }
};

module.exports = runAdminSeed;
