const isPopulated = (ref) => ref && typeof ref === "object" && ref._id;

const mapAppointment = (appointment) => ({
  id: appointment._id,

  startTime: appointment.startTime,

  endTime: appointment.endTime,

  status: appointment.status,

  doctor: isPopulated(appointment.doctor)
    ? {
        id: appointment.doctor._id,
        name: appointment.doctor.displayName,
        specialty: appointment.doctor.specialty,
        price: appointment.doctor.price,
      }
    : null,

  patient: isPopulated(appointment.patient)
    ? {
        id: appointment.patient._id,
        name: appointment.patient.displayName,
      }
    : null,
});

const mapAppointments = (appointments) => appointments.map(mapAppointment);

module.exports = {
  mapAppointment,
  mapAppointments,
};
