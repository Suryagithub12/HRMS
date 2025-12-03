import React, { useState } from "react";
import useAuthStore from "../stores/authstore";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  const [fullName, setFullName] = useState(`${user.firstName} ${user.lastName || ""}`);
  const [email, setEmail] = useState(user.email);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [notifications, setNotifications] = useState(true);

  const saveSettings = () => {
    // Not API-based for now — just UI settings
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    alert("Settings saved!");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">

      {/* Page Title */}
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* SECTION 1 — Profile Info */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border dark:border-gray-700 space-y-4">
        <h2 className="text-xl font-semibold mb-3">Profile Information</h2>

        <div>
          <label className="text-sm text-gray-500">Full Name</label>
          <input
            className="w-full mt-1 p-3 rounded-lg border dark:bg-gray-900 dark:border-gray-700"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-500">Email</label>
          <input
            type="email"
            className="w-full mt-1 p-3 rounded-lg border dark:bg-gray-900 dark:border-gray-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {/* SECTION 2 — Theme Settings */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border dark:border-gray-700 space-y-4">
        <h2 className="text-xl font-semibold mb-3">Appearance</h2>

        <div className="flex items-center gap-4">
          <button
            className={`px-4 py-2 rounded-lg border ${
              theme === "light"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "dark:bg-gray-900 dark:border-gray-700"
            }`}
            onClick={() => setTheme("light")}
          >
            Light Mode
          </button>

          <button
            className={`px-4 py-2 rounded-lg border ${
              theme === "dark"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "dark:bg-gray-900 dark:border-gray-700"
            }`}
            onClick={() => setTheme("dark")}
          >
            Dark Mode
          </button>
        </div>
      </div>

      {/* SECTION 3 — Notification Settings */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border dark:border-gray-700 space-y-4">
        <h2 className="text-xl font-semibold mb-3">Notifications</h2>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={notifications}
            onChange={() => setNotifications(!notifications)}
            className="w-5 h-5"
          />
          <span>Email Notifications</span>
        </label>
      </div>

      {/* Save Button */}
      <button
        onClick={saveSettings}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow"
      >
        Save Settings
      </button>
    </div>
  );
}
