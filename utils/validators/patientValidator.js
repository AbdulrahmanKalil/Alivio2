const Joi = require("joi");

const {
  PHONE_REGEX,
  BLOOD_TYPES,
} = require("../validators/validatorConstants");

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
      .min(3)
      .max(50),

    phone: Joi.string()
      .pattern(PHONE_REGEX)
      .messages({
        "string.pattern.base": "Please provide a valid Egyptian phone number",
      }),

    bloodType: Joi.string().valid(...BLOOD_TYPES),
  }).min(1),
};

exports.patientIdSchema = {
  params: Joi.object({
    id: Joi.string()
      .hex()
      .length(24)
      .required(),
  }),
};
