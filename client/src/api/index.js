import API from './axios';

// Auth APIs
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getProfile: () => API.get('/auth/me')
};

// Patient APIs
export const patientAPI = {
  getDashboard: () => API.get('/patients/dashboard'),
  getProfile: () => API.get('/patients/profile'),
  updateProfile: (data) => API.put('/patients/profile', data)
};

// Medication APIs
export const medicationAPI = {
  getAll: () => API.get('/medications'),
  create: (data) => API.post('/medications', data),
  getById: (id) => API.get(`/medications/${id}`),
  update: (id, data) => API.put(`/medications/${id}`, data),
  delete: (id) => API.delete(`/medications/${id}`),
  logIntake: (id, data) => API.post(`/medications/${id}/log-intake`, data),
  getAdherence: (id) => API.get(`/medications/${id}/adherence`)
};

// Prescription APIs
export const prescriptionAPI = {
  getAll: () => API.get('/prescriptions'),
  create: (formData) => API.post('/prescriptions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getById: (id) => API.get(`/prescriptions/${id}`),
  updateStatus: (id, status) => API.put(`/prescriptions/${id}/status`, { status }),
  delete: (id) => API.delete(`/prescriptions/${id}`),
  parse: (id) => API.post(`/prescriptions/${id}/parse`),
  createMedications: (id, data) => API.post(`/prescriptions/${id}/create-medications`, data)
};

// Pharmacy APIs
export const pharmacyAPI = {
  getDashboard: () => API.get('/pharmacy/dashboard'),
  getPendingPrescriptions: () => API.get('/pharmacy/prescriptions/pending'),
  processPrescription: (id) => API.post(`/pharmacy/prescriptions/${id}/process`)
};

// Inventory APIs
export const inventoryAPI = {
  getAll: (params) => API.get('/inventory', { params }),
  create: (data) => API.post('/inventory', data),
  getById: (id) => API.get(`/inventory/${id}`),
  update: (id, data) => API.put(`/inventory/${id}`, data),
  delete: (id) => API.delete(`/inventory/${id}`),
  restock: (id, data) => API.post(`/inventory/${id}/restock`, data),
  getLowStock: () => API.get('/inventory/alerts/low-stock')
};
