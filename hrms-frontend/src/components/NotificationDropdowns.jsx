import React, { useState, useEffect } from "react";
import { FiBell } from "react-icons/fi";
import api from "../api/axios";

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    // fetch latest 5 notifications
    api.get("/notifications").then(r => setNotes(r.data.notifications || [])).catch(()=>{});
  }, []);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
        <FiBell />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border p-3 z-50">
          <h4 className="font-semibold mb-2">Notifications</h4>
          <div className="max-h-56 overflow-auto space-y-2">
            {notes.length === 0 ? <p className="text-sm text-gray-500">No notifications</p> :
              notes.map(n => (
                <div key={n.id} className="p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-gray-500">{n.body}</div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
