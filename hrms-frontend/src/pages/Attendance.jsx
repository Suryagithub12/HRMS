// src/pages/Attendance.jsx
import React from "react";
import useAuthStore from "../stores/authstore";
import AttendanceAdmin from "./AttendanceAdmin";
import AttendanceEmployee from "./AttendanceEmployee";

export default function Attendance() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = Boolean(user && user.role === "ADMIN");

  return isAdmin ? <AttendanceAdmin /> : <AttendanceEmployee />;
}
