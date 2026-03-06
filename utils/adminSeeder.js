const User = require("../models/userModel");

const runAdminSeed = async () => {
  if (!process.env.ADMIN_EMAIL) return;

  const adminExists = await User.findOne({
    email: process.env.ADMIN_EMAIL,
  });

  if (!adminExists) {
    const admin = await User.create({
      name: "System Admin",
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      passwordConfirm: process.env.ADMIN_PASSWORD,
      role: "admin",
    });

    console.log("✅ Admin created:", admin.email);
  }
};

module.exports = runAdminSeed;
