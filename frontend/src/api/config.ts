import axios, { AxiosResponse } from "axios";

import Cookies from "universal-cookie";

export const cookies = new Cookies();

const config = {
  APIDEV: `http://127.0.0.1:8000/api`,
};

const options = {
  headers: {
    "Content-Type": "application/json;charset=utf-8",
  },
};

export const api = axios.create({
  baseURL: config.APIDEV,
  ...options,
});

api.interceptors.request.use(
  (config) => {
    const token = cookies.get("app_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    const errorCode = error?.response?.status;
    if (errorCode === 401) {
      cookies.remove("app_token");
    }
    return Promise.reject(error);
  }
);
