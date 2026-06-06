import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useNotifications } from "../../context/NotificationContext";
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  CheckCircleIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { GiCoffeeBeans } from "react-icons/gi";
import { useSidebar } from "../../context/SidebarContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { showToast } = useToast();
  const menuRef = useRef();
  const {
    unreadCount,
    notifications,
    markAsRead,
    fetchNotifications,
    wsConnected,
  } = useNotifications();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifDropdownRef = useRef();
  const { toggleSidebar } = useSidebar();

  // Close menu on outside click
  useEffect(() => {
    if (!showUserMenu) return;
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  // Close notification dropdown on outside click
  useEffect(() => {
    if (!showNotifDropdown) return;
    function handleClickOutside(event) {
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(event.target)
      ) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifDropdown]);

  const handleLogout = async () => {
    try {
      setShowUserMenu(false);
      await logout();
      navigate("/login");
    } catch (error) {
      showToast("Logout failed. Please try again.", "error");
    }
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    if (user?.role === "ADMIN") {
      navigate("/admin/profile");
    } else {
      navigate("/profile");
    }
  };

  return (
    <nav className="bg-white border-b border-amber-200 fixed w-full z-30 top-0 left-0">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500 lg:hidden"
              aria-label="Open sidebar menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center">
            {/* Notifications */}
            <div className="relative">
              <button
                className="relative p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500"
                onClick={() => setShowNotifDropdown((v) => !v)}
                aria-label="Show notifications"
              >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifDropdown && (
                <>
                  {/* Backdrop for mobile */}
                  <div
                    className="fixed inset-0 bg-black/30 z-40 sm:hidden"
                    onClick={() => setShowNotifDropdown(false)}
                    aria-hidden="true"
                  />
                  <div
                    ref={notifDropdownRef}
                    className={`
                      fixed left-1/2 top-20 transform -translate-x-1/2 w-[95vw] max-w-sm bg-white border border-amber-200 rounded-lg shadow-lg z-50
                      sm:absolute sm:right-0 sm:top-auto sm:mt-2 sm:left-auto sm:mx-0 sm:w-80 sm:max-w-xs
                    `}
                    style={{ minWidth: '16rem' }}
                  >
                    <div className="p-4 border-b border-amber-100 font-semibold text-amber-900 flex items-center justify-between">
                      <span>Notifications</span>
                      {/* WebSocket connection status indicator */}
                      <span
                        className={`ml-2 w-2 h-2 rounded-full ${
                          wsConnected ? "bg-green-500" : "bg-red-400"
                        }`}
                        title={wsConnected ? "Connected" : "Disconnected"}
                      ></span>
                    </div>
                    <ul className="max-h-80 overflow-y-auto divide-y divide-amber-50">
                      {notifications.length === 0 && (
                        <li className="p-4 text-gray-500 text-sm">
                          No notifications
                        </li>
                      )}
                      {notifications.slice(0, 5).map((notif) => (
                        <li
                          key={notif.id}
                          className={`p-4 cursor-pointer hover:bg-amber-50 flex items-center justify-between ${
                            notif.is_read
                              ? "text-gray-500"
                              : "text-amber-900 font-semibold"
                          }`}
                        >
                          <div
                            className="flex-1"
                            onClick={async () => {
                              if (!notif.is_read) await markAsRead(notif.id);
                              if (notif.link) window.location.href = notif.link;
                              setShowNotifDropdown(false);
                            }}
                          >
                            <div className="text-sm">{notif.message}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(notif.created_at).toLocaleString()}
                            </div>
                          </div>
                          <button
                            className="ml-2 p-1 rounded hover:bg-amber-100"
                            title={
                              notif.is_read ? "Mark as unread" : "Mark as read"
                            }
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (notif.is_read) {
                                // Mark as unread (optional: implement API if needed)
                                // For now, just update state locally
                                // setNotifications((prev) =>
                                //   prev.map((n) =>
                                //     n.id === notif.id
                                //       ? { ...n, is_read: false }
                                //       : n
                                //   )
                                // );
                              } else {
                                await markAsRead(notif.id);
                              }
                            }}
                          >
                            {notif.is_read ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-400" />
                            ) : (
                              <EnvelopeIcon className="h-5 w-5 text-amber-500" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="p-3 border-t border-amber-100 bg-amber-50 rounded-b-lg flex flex-col gap-3">
                      <button
                        className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-800 py-2 px-3 rounded-md transition-all duration-200 hover:bg-amber-100 active:bg-amber-200 active:scale-[0.98] border border-amber-200"
                        onClick={() => {
                          fetchNotifications();
                          setShowNotifDropdown(false);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Refresh
                      </button>
                      <button
                        className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 py-2 px-3 rounded-md transition-all duration-200 hover:shadow-sm active:bg-green-800 active:scale-[0.98]"
                        onClick={async () => {
                          // Mark all as read
                          for (const notif of notifications) {
                            if (!notif.is_read) await markAsRead(notif.id);
                          }
                        }}
                        disabled={unreadCount === 0}
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Mark all as read
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User menu */}
            <div className="ml-4 relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center max-w-xs rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                aria-label="Open user menu"
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <UserCircleIcon className="h-6 w-6 text-amber-600" />
                </div>
                <span className="ml-2 text-sm font-medium text-amber-900 hidden sm:block">
                  {user?.first_name || user?.email}
                </span>
              </button>
              {/* Dropdown menu */}
              {showUserMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu">
                    <button
                      onClick={handleProfileClick}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 cursor-pointer"
                      role="menuitem"
                    >
                      My Profile
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-amber-50 mt-1 cursor-pointer"
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <ArrowRightStartOnRectangleIcon className="h-5 w-5 mr-2" />
                        Sign out
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
