import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome, FiUsers, FiGrid, FiClock, FiBookOpen, FiCreditCard, FiBell,
  FiLogOut, FiChevronDown, FiChevronRight, FiSettings, FiFileText, FiMenu, FiX
} from "react-icons/fi";
import useAuthStore from "../stores/authstore";

export default function SidebarPremium({ isOpen, toggleSidebar }) {
  const [openMenu, setOpenMenu] = useState(null);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const toggleMenu = (name) => setOpenMenu(openMenu === name ? null : name);

  const menus = [
    { title: "Dashboard", icon: <FiHome />, path: "/" },
    { title: "Employees", icon: <FiUsers />, path: "/employees", adminOnly: true },
    { title: "Departments", icon: <FiGrid />, path: "/departments", adminOnly: true },
    { title: "Attendance", icon: <FiClock />, path: "/attendance" },
    { title: "Leaves", icon: <FiBookOpen />, path: "/leaves" },

    // ⭐ REIMBURSEMENT MENU
    { title: "Reimbursement", icon: <FiFileText />, path: "/reimbursements" },
    
    { title: "Payroll", icon: <FiCreditCard />, path: "/payroll", adminOnly: true },
    { title: "Notifications", icon: <FiBell />, path: "/notifications" },

    // SETTINGS DROPDOWN
    { title: "Settings", icon: <FiSettings />, children: [{ title: "Profile", path: "/profile" }] },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-50 transition-all duration-300
      backdrop-blur-xl bg-white/80 dark:bg-gray-800/70 border-r shadow-xl
      ${isOpen ? "w-72" : "w-20"}`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600
            flex items-center justify-center text-white font-bold ${isOpen ? "" : "mx-auto"}`}
          >
            H
          </div>

          <h1
            className={`text-3xl font-extrabold text-transparent bg-clip-text 
            bg-gradient-to-r from-blue-600 to-indigo-600 transition-all
            ${isOpen ? "opacity-100" : "opacity-0"}`}
          >
            HRMS
          </h1>
        </div>

        {/* SIDEBAR CLOSE BUTTON */}
        <button className="md:hidden" onClick={toggleSidebar}>
          {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* MENU ITEMS */}
      <nav className="mt-4 px-2 space-y-2">
        {menus.map((m, idx) => {
          if (m.adminOnly && user.role !== "ADMIN") return null;

          // Normal menu (no children)
          if (!m.children) {
            return (
              <NavLink
                key={idx}
                to={m.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 p-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`
                }
              >
                <span className="text-xl">{m.icon}</span>
                {isOpen && <span className="flex-1">{m.title}</span>}
              </NavLink>
            );
          }

          // Dropdown menu
          return (
            <div key={idx}>
              <button
                onClick={() => toggleMenu(m.title)}
                className="flex items-center gap-4 p-3 w-full rounded-xl
                text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <span className="text-xl">{m.icon}</span>
                {isOpen && <span className="flex-1">{m.title}</span>}
                {isOpen && (openMenu === m.title ? <FiChevronDown /> : <FiChevronRight />)}
              </button>

              {openMenu === m.title && isOpen && (
                <div className="ml-10 mt-2 space-y-2">
                  {m.children.map((c, i) => (
                    <NavLink
                      key={i}
                      to={c.path}
                      className={({ isActive }) =>
                        `block p-2 rounded-lg text-sm ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "text-gray-600 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700"
                        }`
                      }
                    >
                      {c.title}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* LOGOUT */}
        <div className="mt-6">
          <button
            onClick={logout}
            className="flex items-center gap-3 p-3 rounded-xl w-full
            text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <FiLogOut className="text-xl" />
            {isOpen && "Logout"}
          </button>
        </div>
      </nav>
    </aside>
  );
}
