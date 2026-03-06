const Joi = require("joi");

/* ====== UPDATE PATIENT ====== */
exports.updatePatientSchema = {
  params: Joi.object({
    id: Joi.string()
      .hex()
      .length(24)
      .required(),
  }),

  body: Joi.object({
    displayName: Joi.string()
      .trim()
      .min(3),

    doctor: Joi.string()
      .hex()
      .length(24)
      .allow(null),

    phone: Joi.string()
      .pattern(/^(\+20|0)?1[0125][0-9]{8}$/)
      .messages({
        "string.pattern.base": "Please provide a valid Egyptian phone number",
      }),

    address: Joi.string()
      .trim()
      .allow(""),

    bloodType: Joi.string().valid(
      "A+",
      "A-",
      "B+",
      "B-",
      "AB+",
      "AB-",
      "O+",
      "O-",
    ),

    medicalHistory: Joi.string().trim(),
  }).min(1),
};

/* ====== GET / DELETE PATIENT ====== */
exports.patientIdSchema = {
  params: Joi.object({
    id: Joi.string()
      .hex()
      .length(24)
      .required(),
  }),
};
