const PrescriptionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
      index: true,
    },

    diagnosis: {
      type: String,
      required: true,
    },

    medicines: [
      {
        name: { type: String, required: true },
        strength: String,
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: String,

        status: {
          type: String,
          enum: ["active", "stopped", "completed"],
          default: "active",
        },

        startDate: Date,
        stopDate: Date,
      },
    ],

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },

    notes: {
      type: String,
      required: true,
    },

    followUpDate: Date,
  },
  { timestamps: true },
);
