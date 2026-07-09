import { api } from "./api";
import toast from "react-hot-toast";

export const request = {
  async get(url, params = {}) {
    try {
      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },

  async post(url, data = {}, config = {}) {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },

  async put(url, data = {}, config = {}) {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },

  async delete(url) {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  },

  handleError(error) {
    const message = error.response?.data?.message || error.message || "Terjadi kesalahan pada server";
    toast.error(message);
    console.error("API Request Error:", error);
  }
};
