import { Appointment } from '../types';
import { mockAppointments } from '../data/mockData';

let appointments: Appointment[] = [...mockAppointments];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getAppointments = async (): Promise<Appointment[]> => {
    await delay(500);
    return [...appointments];
};

export const getAppointmentsByPatientId = async (patientId: string): Promise<Appointment[]> => {
    await delay(300);
    return appointments.filter(a => a.patientId === patientId);
};

export const saveAppointment = async (appointmentData: Appointment): Promise<Appointment> => {
    await delay(400);
    const index = appointments.findIndex(a => a.id === appointmentData.id);
    if (index > -1) {
        appointments[index] = appointmentData;
    } else {
        appointments.push(appointmentData);
    }
    return appointmentData;
};

export const deleteAppointment = async (id: string): Promise<void> => {
    await delay(400);
    appointments = appointments.filter(a => a.id !== id);
};

export const deleteAppointmentSeries = async (seriesId: string, fromDate: Date): Promise<void> => {
    await delay(400);
    appointments = appointments.filter(a => !(a.seriesId === seriesId && a.startTime >= fromDate));
}
