import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import EmployeeDashboard from "./EmployeeDashboard";
import ManagerDashboard from "./ManagerDashboard";
import AdminDashboard from "./AdminDashboard";
import useAuthStore from "../stores/authstore";

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  // 🔥 SINGLE SOURCE OF TRUTH
  const isManager = user?.managedDepartments?.length > 0;

  // Default view
  const [view, setView] = useState("EMPLOYEE");

  /* =====================================================
     1️⃣ SYNC VIEW AFTER USER LOAD (FIRST LOGIN FIX)
  ===================================================== */
  useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(location.search);
    const urlView = params.get("view");

    if (urlView === "manager" && isManager) {
      setView("MANAGER");
    } else if (isManager) {
      // 🔥 FIRST LOGIN → AUTO MANAGER DASHBOARD
      setView("MANAGER");
    } else {
      setView("EMPLOYEE");
    }
  }, [user, isManager, location.search]);

  /* =====================================================
     2️⃣ SAFETY: MANAGER RIGHTS REMOVED
  ===================================================== */
  useEffect(() => {
    if (view === "MANAGER" && !isManager) {
      setView("EMPLOYEE");
    }
  }, [view, isManager]);

  /* =====================================================
     3️⃣ ADMIN
  ===================================================== */
  if (user?.role === "ADMIN") {
    return <AdminDashboard />;
  }

  return (
    <div className="space-y-4">
      {/* 🔀 TOGGLE (ONLY FOR MANAGER) */}
      {isManager && (
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-xl w-fit">
          <button
            onClick={() => setView("EMPLOYEE")}
            className={`px-4 py-2 rounded-lg text-sm ${
              view === "EMPLOYEE"
                ? "bg-indigo-600 text-white"
                : "bg-transparent"
            }`}
          >
            My Dashboard
          </button>

          <button
            onClick={() => setView("MANAGER")}
            className={`px-4 py-2 rounded-lg text-sm ${
              view === "MANAGER"
                ? "bg-indigo-600 text-white"
                : "bg-transparent"
            }`}
          >
            Manage Department
          </button>
        </div>
      )}

      {/* 🧠 CONTENT */}
      {view === "MANAGER" && isManager ? (
        <ManagerDashboard />
      ) : (
        <EmployeeDashboard />
      )}
    </div>
  );
}
