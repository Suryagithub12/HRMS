import React from "react";
import { FiMoon, FiSun } from "react-icons/fi";

export default function DarkModeToggle({ dark, toggleDark }) {
  return (
    <button onClick={toggleDark} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
      {dark ? <FiSun /> : <FiMoon />}
    </button>
  );
}
