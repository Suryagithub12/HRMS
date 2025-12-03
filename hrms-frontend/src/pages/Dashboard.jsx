// src/pages/Dashboard.jsx
import React from "react";
import useAuthStore from "../stores/authstore";
import AdminDashboard from "./AdminDashboard";
import EmployeeDashboard from "./EmployeeDashboard";

/**
 * Lightweight chooser:
 * renders AdminDashboard for ADMIN role, otherwise EmployeeDashboard.
 */
export default function Dashboard() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null; // auth layer/protected route should guard this

  if (user.role === "ADMIN") {
    return <AdminDashboard />;
  }

  return <EmployeeDashboard />;
}
