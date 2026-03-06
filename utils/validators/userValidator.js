const Joi = require("joi");

const SPECIALTIES = [
  "cardiology",
  "dermatology",
  "neurology",
  "pediatrics",
  "general",
  "orthopedics",
  "dentistry",
  "psychiatry",
];

const DAYS = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

exports.signupDoctorSchema = {
  body: Joi.object({
    /* ===== USER ===== */
    name: Joi.string()
      .trim()
      .min(3)
      .required(),
    email: Joi.string()
      .email()
      .required(),
    password: Joi.string()
      .min(8)
      .required(),
    passwordConfirm: Joi.string()
      .valid(Joi.ref("password"))
      .required(),

    /* ===== DOCTOR ===== */
    displayName: Joi.string()
      .trim()
      .min(3)
      .required(),
    phone: Joi.string()
      .pattern(/^01[0-9]{9}$/)
      .required(),
    specialty: Joi.string()
      .lowercase()
      .valid(...SPECIALTIES)
      .required(),
    yearsOfExperience: Joi.number()
      .min(0)
      .max(50)
      .required(),
    price: Joi.number()
      .min(50)
      .required(),
    schedule: Joi.array()
      .items(
        Joi.string()
          .lowercase()
          .valid(...DAYS),
      )
      .min(1)
      .required(),
    workingHours: Joi.object({
      start: Joi.string().pattern(TIME_REGEX),
      end: Joi.string().pattern(TIME_REGEX),
    })
      .custom((value, helpers) => {
        if (!value.start || !value.end) return value;
        if (value.start >= value.end) {
          return helpers.error("any.invalid");
        }
        return value;
      })
      .messages({
        "any.invalid": "workingHours.start must be before workingHours.end",
      }),
  }),
};

//* ====== SIGNUP PATIENT ====== */
exports.signupPatientSchema = {
  body: Joi.object({
    /* ===== USER ===== */
    name: Joi.string()
      .trim()
      .min(3)
      .required(),

    email: Joi.string()
      .email()
      .required(),

    password: Joi.string()
      .min(8)
      .required(),

    passwordConfirm: Joi.string()
      .valid(Joi.ref("password"))
      .required(),

    /* ===== PATIENT ===== */
    displayName: Joi.string()
      .trim()
      .min(3)
      .required(),

    phone: Joi.string()
      .pattern(/^(\+20|0)?1[0125][0-9]{8}$/)
      .required()
      .messages({
        "string.pattern.base": "Please provide a valid Egyptian phone number",
      }),

    address: Joi.string()
      .trim()
      .allow(""),

    bloodType: Joi.string()
      .valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
      .default("A+"),

    chronicConditions: Joi.string()
      .trim()
      .default("None"),
  }),
};

exports.updateUserSchema = {
  params: Joi.object({
    id: Joi.string()
      .hex()
      .length(24)
      .required(),
  }),

  body: Joi.object({
    password: Joi.string().min(8),
    passwordConfirm: Joi.string()
      .valid(Joi.ref("password"))
      .messages({
        "any.only": "Passwords are not the same!",
      }),
  }).min(1),
};
