import axios from "axios";

const BASE_URL = "https://api.kingcreativestudio.my.id/taekwondo-tms";

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

const prefixUploads = (obj) => {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    if (obj.startsWith('/uploads/')) {
      return `${BASE_URL}${obj}`;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(prefixUploads);
  }
  if (typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = prefixUploads(obj[key]);
    }
    return newObj;
  }
  return obj;
};

// Request interceptor to attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("tms_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / unauthenticated states and rewrite uploads path
api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.data) {
      response.data.data = prefixUploads(response.data.data);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("tms_token");
      localStorage.removeItem("tms_user");
      // Redirect to login if not already there
      if (!window.location.pathname.endsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
