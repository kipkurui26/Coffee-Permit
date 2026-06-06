import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axiosInstance from "../utils/AxiosInstance";
import { useAuth } from "../context/AuthContext"; // adjust path as needed
import { useLocation } from "react-router-dom";
import { useToast } from "./ToastContext"; // Added import for useToast

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);
  const [wsConnected, setWsConnected] = useState(true);
  const reconnectDelay = 3000;
  const maxRetries = 10;
  const retryRef = React.useRef(0);
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const { showToast } = useToast ? useToast() : { showToast: undefined };

  // Helper to check if current path is a public page
  const isPublicPage =
    /^\/cancel-application\//.test(location.pathname) ||
    ["/login", "/register", "/activation", "/forgot-password"].includes(
      location.pathname,
    ) ||
    /^\/reset-password\//.test(location.pathname);

  const fetchNotifications = useCallback(async () => {
    if (isPublicPage) return; // Don't fetch notifications on public pages
    setLoading(true);
    try {
      const res = await axiosInstance.get("/auth/notifications/");
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  }, [isPublicPage]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const setupWebSocket = useCallback(() => {
    if (isPublicPage) return null;
    const wsUrl = `${import.meta.env.VITE_WS_BASE_URL}/notifications/`;
    const socket = new window.WebSocket(wsUrl);
    setWs(socket);

    socket.onopen = () => {
      setWsConnected(true);
      retryRef.current = 0;
    };
    socket.onmessage = (event) => {
      try {
        const notif = JSON.parse(event.data);
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
      } catch (e) {
        // Ignore parse errors
      }
    };
    socket.onclose = () => {
      setWsConnected(false);
      if (retryRef.current < maxRetries) {
        setTimeout(() => {
          retryRef.current += 1;
          setupWebSocket();
        }, reconnectDelay);
      }
    };
    socket.onerror = () => {
      socket.close();
    };
    return socket;
  }, [isPublicPage]);

  useEffect(() => {
    if (!isAuthenticated || isPublicPage) return;
    const socket = setupWebSocket();
    return () => socket && socket.close();
  }, [setupWebSocket, isAuthenticated, isPublicPage]);

  const markAsRead = async (id) => {
    try {
      await axiosInstance.patch(`/auth/notifications/${id}/`, {
        is_read: true,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (err) {
      if (showToast) {
        showToast("Failed to mark notification as read", "error");
      } else {
        console.error("Failed to mark notification as read", err);
      }
    }
  };

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.is_read).length
    : 0;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        wsConnected,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
