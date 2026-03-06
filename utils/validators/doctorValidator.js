 
const Joi = require("joi");

/* ====== CONSTANTS (مطابقة للموديل) ====== */
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

/* ====== UPDATE DOCTOR (PATCH) ====== */
exports.updateDoctorSchema = {
    params: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
    
    body: Joi.object({
        displayName: Joi.string().trim().min(3).max(50),
        
        phone: Joi.string().pattern(/^01[0-9]{9}$/),
        
        specialty: Joi.string()
        .lowercase()
        .valid(...SPECIALTIES),
        
        yearsOfExperience: Joi.number().min(0).max(50),
        
        price: Joi.number().min(50),
        
        schedule: Joi.array()
        .items(Joi.string().lowercase().valid(...DAYS))
        .min(1),
        
        workingHours: Joi.object({
            start: Joi.string().pattern(TIME_REGEX),
            end: Joi.string().pattern(TIME_REGEX),
        }),
        
        gender: Joi.string().lowercase().valid("male", "female"),
        
        description: Joi.string().trim().max(500),
        
        image: Joi.string(),
        
        isActive: Joi.boolean(),
    }).min(1),
};

/* ====== PARAMS ONLY (GET / DELETE) ====== */
exports.doctorIdSchema = {
    params: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
};
