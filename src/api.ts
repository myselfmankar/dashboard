import axios from 'axios';
import localDb from '../db.json';

const BASE_URL = 'http://localhost:3001';

const client = axios.create({
  baseURL: BASE_URL,
});

export const api = {
  getKpis: async () => {
    try { const { data } = await client.get('/kpis'); return data; } catch(e) { return (localDb as any).kpis; }
  },
  getAlerts: async () => {
    try { const { data } = await client.get('/alerts'); return data; } catch(e) { return (localDb as any).alerts; }
  },
  getDemographics: async () => {
    try { const { data } = await client.get('/demographics'); return data; } catch(e) { return (localDb as any).demographics; }
  },
  getTeachers: async () => {
    try { const { data } = await client.get('/teachers'); return data; } catch(e) { return (localDb as any).teachers; }
  },
  getStudents: async () => {
    try { const { data } = await client.get('/students'); return data; } catch(e) { return (localDb as any).students; }
  },
  getEmployees: async () => {
    try { const { data } = await client.get('/employees'); return data; } catch(e) { return (localDb as any).employees; }
  },
  getTimetable: async () => {
    try { const { data } = await client.get('/timetable'); return data; } catch(e) { return (localDb as any).timetable; }
  },
  getWeakConcepts: async () => {
    try { const { data } = await client.get('/weakConceptAnalytics'); return data; } catch(e) { return (localDb as any).weakConceptAnalytics; }
  }
};
