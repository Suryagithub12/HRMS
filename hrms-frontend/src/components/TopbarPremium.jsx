import React from "react";
import { FiMenu } from "react-icons/fi";

export default function TopbarPremium({ toggleSidebar, children }) {
  return (
    <header className="
      bg-white/80 dark:bg-gray-800/70 
      backdrop-blur-md shadow 
      px-4 py-4 
      flex items-center justify-between 
      sticky top-0 z-50 
      border-b border-gray-200 dark:border-gray-700
    ">
      
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button 
          className="md:hidden text-2xl" 
          onClick={toggleSidebar}
        >
          <FiMenu />
        </button>
      </div>

      {/* RIGHT AREA: PROFILE MENU / NOTIFICATION / THEME SWITCH */}
      <div className="flex items-center gap-4 relative z-50">
        {children}
      </div>
    </header>
  );
}
