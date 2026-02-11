const mapAppointment = (appointment) => ({
  id: appointment._id,
  date: appointment.date,
  status: appointment.status,
  doctor: appointment.doctor
    ? {
        id: appointment.doctor._id,
        name: appointment.doctor.displayName,
        specialty: appointment.doctor.specialty,
        price: appointment.doctor.price,
      }
    : null,
  patient: appointment.patient
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
