import React, { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/authstore";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const goProfile = () => {
    navigate("/profile");   // <-- page open
    setOpen(false);
  };

  // const goSettings = () => {
  //   navigate("/settings");  // <-- page open
  //   setOpen(false);
  // };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2"
      >
        <img
          src={`https://ui-avatars.com/api/?name=${user.firstName}`}
          className="w-9 h-9 rounded-full border"
        />
        <span>{user.firstName}</span>
        <FiChevronDown />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-gray-900 text-white rounded-xl shadow-lg p-3 z-50">
          <button
            onClick={goProfile}
            className="block w-full text-left px-3 py-2 rounded hover:bg-gray-800"
          >
            Profile
          </button>

          {/* <button
            onClick={goSettings}
            className="block w-full text-left px-3 py-2 rounded hover:bg-gray-800"
          >
            Settings
          </button> */}

          <button
            onClick={logout}
            className="block w-full text-left px-3 py-2 rounded text-red-400 hover:bg-red-900/30"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
