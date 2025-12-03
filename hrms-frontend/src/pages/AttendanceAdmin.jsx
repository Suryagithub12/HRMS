// src/pages/AttendanceAdmin.jsx
import React, { useEffect, useState, useCallback } from "react";
import api from "../api/axios";

/* ----------------------------------------------------------
   SHARED HELPERS
---------------------------------------------------------- */
const toISODate = (d) => {
  if (!d) return null;
  const x = new Date(d);
  return isNaN(x) ? null : x.toISOString().slice(0, 10);
};

const parseHours = (cin, cout) => {
  if (!cin || !cout) return 0;
  const diff = new Date(cout) - new Date(cin);
  return diff > 0 ? +(diff / 3600000).toFixed(2) : 0;
};

const formatTime = (v) =>
  v
    ? new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--";

/* QUICK FILTER HELPERS */
const getToday = () => {
  const t = toISODate(new Date());
  return { start: t, end: t };
};
const getThisWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
  return { start: toISODate(mon), end: toISODate(sun) };
};
const getThisMonth = () => {
  const d = new Date();
  return {
    start: toISODate(new Date(d.getFullYear(), d.getMonth(), 1)),
    end: toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
  };
};
const getThisYear = () => {
  const d = new Date();
  return {
    start: toISODate(new Date(d.getFullYear(), 0, 1)),
    end: toISODate(new Date(d.getFullYear(), 11, 31)),
  };
};

/* ----------------------------------------------------------
   SMALL UI CARD
---------------------------------------------------------- */
function StatCard({ title, value, color }) {
  return (
    <div className="p-4 bg-white/70 dark:bg-gray-800/50 rounded-xl shadow border border-gray-200 dark:border-gray-700 text-center">
      <p className="text-sm text-gray-500 dark:text-gray-300">{title}</p>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
    </div>
  );
}

/* ----------------------------------------------------------
   MAIN ADMIN ATTENDANCE
---------------------------------------------------------- */
export default function AttendanceAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    start: getToday().start,
    end: getToday().end,
    departmentId: "",
    userId: "",
    status: "",
  });

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [attendanceList, setAttendanceList] = useState([]);
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    wfh: 0, // FIXED
  });

  const [employeeModal, setEmployeeModal] = useState(null);

/* ----------------------------------------------------------
   LOAD DEPARTMENTS + USERS
---------------------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const [d, u] = await Promise.all([
          api.get("/departments"),
          api.get("/users"),
        ]);
        setDepartments(d.data.departments ?? []);
        setEmployees(u.data.users ?? []);
      } catch {}
    })();
  }, []);

/* ----------------------------------------------------------
   LOAD ATTENDANCE (ADMIN)
---------------------------------------------------------- */
  const loadAttendance = useCallback(async (overrides = null) => {
    const f = overrides ? { ...filters, ...overrides } : filters;

    try {
      setLoading(true);
      setError("");

      const q = new URLSearchParams();
      if (f.start) q.append("start", f.start);
      if (f.end) q.append("end", f.end);
      if (f.departmentId) q.append("departmentId", f.departmentId);
      if (f.userId) q.append("userId", f.userId);
      if (f.status) q.append("status", f.status);

      const res = await api.get(`/attendance/all?${q.toString()}`);

      const att = res.data.attendances ?? [];

   setAttendanceList(
    att.map((a) => ({
        ...a,
        totalHours:
            a.status === "WFH"
                ? "WFH"
                : parseHours(a.checkIn, a.checkOut),
    }))
);

// 🔥 FIX WFH summary count
setSummary({
  ...res.data.summary,
  wfh: att.filter((a) => a.status === "WFH").length,
});


  setSummary({
  present: res.data.summary.present,
  absent: res.data.summary.absent,
  late: res.data.summary.late,
  leave: res.data.summary.leave,
  wfh: att.filter((a) => a.status === "WFH").length, // FIXED
});

    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load attendance");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

/* ----------------------------------------------------------
   EXPORT CSV / EXCEL
---------------------------------------------------------- */
  const exportFile = async (format = "csv") => {
    try {
      const q = new URLSearchParams();
      if (filters.start) q.append("start", filters.start);
      if (filters.end) q.append("end", filters.end);

      const res = await api.get(
        `/attendance/export?format=${format}&${q.toString()}`,
        { responseType: "blob" }
      );

      const type =
        res.headers["content-type"] ||
        (format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "text/csv");

      const blob = new Blob([res.data], { type });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Export failed");
    }
  };

/* ----------------------------------------------------------
   OPEN EMPLOYEE MODAL
---------------------------------------------------------- */
  const openEmployeeModal = async (userId) => {
    try {
      const month = filters.start?.slice(0, 7);
      const res = await api.get(`/attendance/user/${userId}/month?month=${month}`);
      setEmployeeModal({ user: res.data.user, logs: res.data.days });
    } catch {
      setError("Failed to load employee logs");
    }
  };

/* ----------------------------------------------------------
   UI STRUCTURE
---------------------------------------------------------- */
  return (
    <div className="space-y-6">

      {/* EXPORT BUTTONS */}
      <div className="flex justify-end gap-2">
        <button onClick={() => exportFile("csv")}
          className="px-3 py-1 bg-indigo-600 text-white rounded-lg shadow">
          CSV
        </button>

        <button onClick={() => exportFile("xlsx")}
          className="px-3 py-1 bg-indigo-600 text-white rounded-lg shadow">
          Excel
        </button>
      </div>

      {error && <div className="p-3 bg-red-200 text-red-800 rounded-lg">{error}</div>}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Present" value={summary.present} color="text-green-600" />
        <StatCard title="WFH" value={summary.wfh} color="text-blue-600" />
        <StatCard title="Leave" value={summary.leave} color="text-yellow-600" />
        {/* <StatCard title="Late" value={summary.late} color="text-orange-600" /> */}
      </div>

      {/* FILTER PANEL */}
      <AdminFilters
        filters={filters}
        departments={departments}
        employees={employees}
        setFilters={setFilters}
        loadAttendance={loadAttendance}
      />

      {/* ATTENDANCE TABLE */}
      <AttendanceTable
        rows={attendanceList}
        loading={loading}
        onView={openEmployeeModal}
      />

      {/* MODAL */}
      {employeeModal && (
        <EmployeeModal
          employee={employeeModal.user}
          logs={employeeModal.logs}
          onClose={() => setEmployeeModal(null)}
        />
      )}
    </div>
  );
}
/* ----------------------------------------------------------
   FILTER PANEL
---------------------------------------------------------- */
function AdminFilters({ filters, departments, employees, setFilters, loadAttendance }) {
  
  const applyRange = (r) => {
    setFilters((p) => ({ ...p, start: r.start, end: r.end }));
    loadAttendance(r);
  };

  return (
    <div className="p-4 rounded-xl bg-white/70 dark:bg-gray-800/50 shadow border border-gray-200 dark:border-gray-700 space-y-4">

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => applyRange(getToday())}
          className="px-3 py-1 bg-blue-600 text-white rounded-lg">Today</button>

        <button onClick={() => applyRange(getThisWeek())}
          className="px-3 py-1 bg-purple-600 text-white rounded-lg">This Week</button>

        <button onClick={() => applyRange(getThisMonth())}
          className="px-3 py-1 bg-green-600 text-white rounded-lg">This Month</button>

        <button onClick={() => applyRange(getThisYear())}
          className="px-3 py-1 bg-orange-600 text-white rounded-lg">This Year</button>
      </div>

      {/* Detailed Filters */}
      <div className="grid md:grid-cols-5 gap-4">

        <div>
          <label className="text-sm">Start</label>
          <input
            type="date"
            className="w-full px-2 py-1 rounded border bg-white dark:bg-gray-900"
            value={filters.start}
            onChange={(e) =>
              setFilters((p) => ({ ...p, start: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="text-sm">End</label>
          <input
            type="date"
            className="w-full px-2 py-1 rounded border bg-white dark:bg-gray-900"
            value={filters.end}
            onChange={(e) =>
              setFilters((p) => ({ ...p, end: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="text-sm">Department</label>
          <select
            className="w-full px-2 py-1 rounded border bg-white dark:bg-gray-900"
            value={filters.departmentId}
            onChange={(e) =>
              setFilters((p) => ({ ...p, departmentId: e.target.value }))
            }
          >
            <option value="">All</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm">Employee</label>
          <select
            className="w-full px-2 py-1 rounded border bg-white dark:bg-gray-900"
            value={filters.userId}
            onChange={(e) =>
              setFilters((p) => ({ ...p, userId: e.target.value }))
            }
          >
            <option value="">All</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.firstName}</option>
            ))}
          </select>
        </div>

        {/* WFH Filter FIX */}
        <div>
          <label className="text-sm">Status</label>
          <select
            className="w-full px-2 py-1 rounded border bg-white dark:bg-gray-900"
            value={filters.status}
            onChange={(e) =>
              setFilters((p) => ({ ...p, status: e.target.value }))
            }
          >
            <option value="">All</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="WFH">WFH</option>   {/* FIX */}
            <option value="LEAVE">Leave</option>
          </select>
        </div>

      </div>

      <button
        onClick={() => loadAttendance()}
        className="px-5 py-2 bg-indigo-600 text-white rounded-lg shadow"
      >
        Apply Filters
      </button>
    </div>
  );
}

/* ----------------------------------------------------------
   TABLE
---------------------------------------------------------- */
function AttendanceTable({ rows, loading, onView }) {
  return (
    <div className="rounded-xl bg-white/70 dark:bg-gray-800/50 shadow border border-gray-200 dark:border-gray-700 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            <th className="p-2 text-left">Employee</th>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">In</th>
            <th className="p-2 text-left">Out</th>
            <th className="p-2 text-left">Hours</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan="7" className="text-center p-4">Loading...</td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center p-4">No records</td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-t dark:border-gray-700">

                <td className="p-2">{r?.user?.firstName}</td>
                <td className="p-2">{toISODate(r.date)}</td>

                {/* WFH FIX — show dash for no check-in/out */}
                <td className="p-2">
                  {r.status === "WFH" ? "—" : formatTime(r.checkIn)}
                </td>

                <td className="p-2">
                  {r.status === "WFH" ? "—" : formatTime(r.checkOut)}
                </td>

                {/* Hours Fix */}
                <td className="p-2">
                  {r.status === "WFH" ? "WFH" : `${r.totalHours} hrs`}
                </td>

                <td
                  className={`p-2 font-semibold ${
                    r.status === "PRESENT"
                      ? "text-green-600"
                      : r.status === "ABSENT"
                      ? "text-red-600"
                      : r.status === "LATE"
                      ? "text-orange-600"
                      : r.status === "WFH"
                      ? "text-blue-600"
                      : "text-yellow-600"
                  }`}
                >
                  {r.status}
                </td>

                <td className="p-2">
                  <button
                    onClick={() => onView(r.userId)}
                    className="text-indigo-600 dark:text-indigo-400 underline"
                  >
                    View Logs
                  </button>
                </td>

              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ----------------------------------------------------------
   EMPLOYEE MODAL
---------------------------------------------------------- */
function EmployeeModal({ employee, logs, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 max-w-3xl w-full">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            Attendance — {employee?.firstName}
          </h2>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {logs?.length === 0 ? (
            <p className="col-span-7 text-center">No logs found</p>
          ) : (
            logs.map((d) => (
              <div
                key={d.id}
                className="p-2 rounded-lg border dark:border-gray-700 bg-white/80 dark:bg-gray-800 text-center"
              >
                <p className="font-semibold">{toISODate(d.date)}</p>
                <p className="text-xs">{d.status}</p>
                <p className="text-xs">In: {formatTime(d.checkIn)}</p>
                <p className="text-xs">Out: {formatTime(d.checkOut)}</p>
                <p className="text-xs">
                  Hours: {d.status === "WFH" ? "WFH" : parseHours(d.checkIn, d.checkOut)}
                </p>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
