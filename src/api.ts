import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

const client = axios.create({
  baseURL: BASE_URL,
});

export const api = {
  getKpis: async () => {
    const { data } = await client.get('/kpis');
    return data;
  },
  getAlerts: async () => {
    const { data } = await client.get('/alerts');
    return data;
  },
  getDemographics: async () => {
    const { data } = await client.get('/demographics');
    return data;
  },
  getTeachers: async () => {
    const { data } = await client.get('/teachers');
    return data;
  },
  getStudents: async () => {
    const { data } = await client.get('/students');
    return data;
  },
  getEmployees: async () => {
    const { data } = await client.get('/employees');
    return data;
  },
  getTimetable: async () => {
    const { data } = await client.get('/timetable');
    return data;
  },
  getWeakConcepts: async () => {
    const { data } = await client.get('/weakConceptAnalytics');
    return data;
  }
};
