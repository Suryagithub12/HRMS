import React from "react";
import { FiPlus } from "react-icons/fi";

export default function FAB() {
  return (
    <button className="fixed right-6 bottom-6 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition">
      <FiPlus />
    </button>
  );
}
