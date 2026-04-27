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
    name: Joi.string().trim().min(3).max(50).required(),

    email: Joi.string().email().lowercase().trim().required(),

    password: Joi.string().min(8).max(72).required(),

    passwordConfirm: Joi.string().valid(Joi.ref("password")).required(),

    displayName: Joi.string().trim().min(3).max(50).required(),

    phone: Joi.string().pattern(PHONE_REGEX).required(),

    specialty: Joi.string()
      .valid(...SPECIALTIES)
      .required(),

    yearsOfExperience: Joi.number().min(0).max(50).required(),

    price: Joi.number().min(50).max(10000).required(),

    gender: Joi.string().valid("male", "female").required(),

    description: Joi.string().trim().max(500),

    dateOfBirth: Joi.date().max("now").required(),

    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      country: Joi.string().required(),
    }).required(),

    schedule: Joi.array()
      .items(Joi.string().valid(...DAYS))
      .min(1)
      .unique()
      .required(),

    workingHours: Joi.object({
      start: Joi.string().pattern(TIME_REGEX).required(),
      end: Joi.string().pattern(TIME_REGEX).required(),
    })
      .custom((value, helpers) => {
        const [sH, sM] = value.start.split(":").map(Number);
        const [eH, eM] = value.end.split(":").map(Number);

        if (sH * 60 + sM >= eH * 60 + eM) {
          return helpers.error("any.invalid");
        }

        return value;
      })
      .required(),
  }),
};

exports.resetPasswordSchema = {
  params: Joi.object({
    token: Joi.string().required(),
  }),

  body: Joi.object({
    password: Joi.string().min(8).max(72).required(),

    passwordConfirm: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
      }),
  }),
};

exports.signupPatientSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(3).max(50).required(),

    email: Joi.string().email().max(254).required(),

    password: Joi.string().min(8).max(72).required(),

    passwordConfirm: Joi.string().valid(Joi.ref("password")).required(),

    displayName: Joi.string().trim().min(3).max(50).required(),

    phone: Joi.string().pattern(PHONE_REGEX).required(),

    bloodType: Joi.string()
      .valid(...BLOOD_TYPES)
      .default("Unknown"),
  }),
};

exports.updateUserSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),

  body: Joi.object({
    name: Joi.string().trim().min(3).max(50),

    email: Joi.string().email().max(254),
  }).min(1),
};
