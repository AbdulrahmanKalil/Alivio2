const Joi = require("joi");

const {
  SPECIALTIES,
  DAYS,
  TIME_REGEX,
  PHONE_REGEX,
  BLOOD_TYPES,
} = require("../validators/validatorConstants");

exports.signupDoctorSchema = {
  body: Joi.object({
    name: Joi.string()
      .trim()
      .min(3)
      .max(50)
      .required(),

    email: Joi.string()
      .email()
      .max(254)
      .required(),

    password: Joi.string()
      .min(8)
      .max(72)
      .required(),

    passwordConfirm: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
      }),

    displayName: Joi.string()
      .trim()
      .min(3)
      .max(50)
      .required(),

    phone: Joi.string()
      .pattern(PHONE_REGEX)
      .required()
      .messages({
        "string.pattern.base": "Please provide a valid Egyptian phone number",
      }),

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

    gender: Joi.string()
      .lowercase()
      .valid("male", "female")
      .required(),

    description: Joi.string()
      .trim()
      .max(500),

    schedule: Joi.array()
      .items(
        Joi.string()
          .lowercase()
          .valid(...DAYS),
      )
      .min(1)
      .max(7)
      .unique()
      .required(),

    workingHours: Joi.object({
      start: Joi.string()
        .pattern(TIME_REGEX)
        .required(),

      end: Joi.string()
        .pattern(TIME_REGEX)
        .required(),
    })
      .required()
      .custom((value, helpers) => {
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

exports.signupPatientSchema = {
  body: Joi.object({
    name: Joi.string()
      .trim()
      .min(3)
      .max(50)
      .required(),

    email: Joi.string()
      .email()
      .max(254)
      .required(),

    password: Joi.string()
      .min(8)
      .max(72)
      .required(),

    passwordConfirm: Joi.string()
      .valid(Joi.ref("password"))
      .required(),

    displayName: Joi.string()
      .trim()
      .min(3)
      .max(50)
      .required(),

    phone: Joi.string()
      .pattern(PHONE_REGEX)
      .required(),

    bloodType: Joi.string()
      .valid(...BLOOD_TYPES)
      .default("Unknown"),
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
    name: Joi.string()
      .trim()
      .min(3)
      .max(50),

    email: Joi.string()
      .email()
      .max(254),
  }).min(1),
};
