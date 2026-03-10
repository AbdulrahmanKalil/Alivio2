const Joi = require("joi");

const {
  SPECIALTIES,
  DAYS,
  TIME_REGEX,
  PHONE_REGEX,
} = require("../validators/validatorConstants");

const workingHoursSchema = Joi.object({
  start: Joi.string().pattern(TIME_REGEX),
  end: Joi.string().pattern(TIME_REGEX),
})
  .custom((value, helpers) => {
    if (value.start && value.end && value.start >= value.end) {
      return helpers.error("any.invalid");
    }

    return value;
  })
  .messages({
    "any.invalid": "workingHours.start must be before workingHours.end",
  });

exports.updateDoctorSchema = {
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

    specialty: Joi.string()
      .lowercase()
      .valid(...SPECIALTIES),

    yearsOfExperience: Joi.number()
      .min(0)
      .max(50),

    price: Joi.number().min(50),

    schedule: Joi.array()
      .items(
        Joi.string()
          .lowercase()
          .valid(...DAYS),
      )
      .min(1)
      .max(7)
      .unique(),

    workingHours: workingHoursSchema,

    gender: Joi.string()
      .lowercase()
      .valid("male", "female"),

    description: Joi.string()
      .trim()
      .max(500),

    image: Joi.string().uri({ scheme: ["http", "https"] }),

    isActive: Joi.boolean(),
  }).min(1),
};

exports.doctorIdSchema = {
  params: Joi.object({
    id: Joi.string()
      .hex()
      .length(24)
      .required(),
  }),
};
