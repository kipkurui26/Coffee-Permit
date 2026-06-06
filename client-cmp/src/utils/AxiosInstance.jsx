import axios from "axios";

// Global toast trigger for use outside React components
export let showGlobalToast = null;

let csrfToken = null;

export const fetchCsrfToken = async () => {
  try {
    const response = await axiosInstance.get("/auth/csrf/");
    if (response.data && response.data.csrfToken) {
      csrfToken = response.data.csrfToken;
    }
  } catch (error) {
    // Optionally handle error
    csrfToken = null;
  }
};

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

let isRefreshing = false;
let failedQueue = [];
let refreshPromise = null;

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshToken = async () => {
  try {
    await axiosInstance.post("/auth/token/refresh/");
  } catch (error) {
    if (error.response?.status === 401) {
      // Refresh token expired
      window.location.href = "/login";
    }
    throw error;
  }
};

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // No need to set Authorization header, cookies are sent automatically
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      if (!refreshPromise) {
        refreshPromise = refreshToken()
          .then(() => {
            processQueue(null);
          })
          .catch((error) => {
            processQueue(error, null);
            throw error;
          })
          .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
      }

      try {
        await refreshPromise;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        if (!window.location.pathname.includes("/login")) {
          if (typeof window.showGlobalToast === "function") {
            window.showGlobalToast(
              "Your session has expired. Please log in again.",
              "error",
            );
          }
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

// Improved proactive token refresh
export const setupTokenRefresh = () => {
  // Set to 22 hours (in ms) to refresh before 1-day expiry
  const refreshInterval = 22 * 60 * 60 * 1000; // 22 hours
  let refreshTimer = null;

  const scheduleRefresh = () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(async () => {
      try {
        await refreshToken();
        scheduleRefresh();
      } catch (error) {
        console.error("Token refresh failed:", error);
        // Retry after 1 minute if failed
        setTimeout(scheduleRefresh, 60 * 1000);
      }
    }, refreshInterval);
  };

  scheduleRefresh();

  return () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
  };
};

export default axiosInstance;
