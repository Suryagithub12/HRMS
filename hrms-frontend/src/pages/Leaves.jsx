// ====================== Leaves.jsx (FINAL WITH POPUP) ======================
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import useAuthStore from "../stores/authstore";
import { FiPlusCircle, FiCalendar, FiClock } from "react-icons/fi";

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  /* ---- Pagination ---- */
const [page, setPage] = useState(1);
const PAGE_SIZE = 10;

const paginatedLeaves = React.useMemo(() => {
  const start = (page - 1) * PAGE_SIZE;
  return leaves.slice(start, start + PAGE_SIZE);
}, [page, leaves]);

const totalPages = Math.ceil(leaves.length / PAGE_SIZE);

  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    type: "PAID",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [showTodayPopup, setShowTodayPopup] = useState(false);
  const [todayForm, setTodayForm] = useState({
    type: "SICK",
    reason: "",
  });

  const user = useAuthStore((s) => s.user);
  const isAdmin = user.role === "ADMIN";

  /* === Auto Hide Alert === */
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 2000);
    return () => clearTimeout(t);
  }, [msg]);

  /* === Load Leaves === */
  const load = async () => {
    try {
      setLoading(true);
      const r = await api.get("/leaves");
      setLeaves(r.data.leaves || []);
    } catch (err) {
      setMsg("Failed to load leaves");
      setMsgType("error");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  /* === Apply Leave === */
  const apply = async () => {
    try {
      await api.post("/leaves", form);

      setMsg("Your leave is successfully sent. Please wait for approval.");
      setMsgType("success");

      setForm({ type: "PAID", startDate: "", endDate: "", reason: "" });
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed");
      setMsgType("error");
    }
  };

  /* === Apply Today Leave (via Popup) === */
  const submitTodayLeave = async () => {
    const today = new Date().toISOString().slice(0, 10);

    try {
      await api.post("/leaves", {
        type: todayForm.type,
        startDate: today,
        endDate: today,
        reason: todayForm.reason || "Taking leave today",
      });

      setMsg("Your leave is successfully sent. Please wait for approval.");
      setMsgType("success");

      setTodayForm({ type: "SICK", reason: "" });
      setShowTodayPopup(false);

      load();
    } catch (err) {
      setMsg("Failed to apply leave");
      setMsgType("error");
    }
  };

  /* === Admin Update === */
const updateStatus = async (id, status) => {
  try {
    await api.patch(`/leaves/${id}/approve`, { action: status });

    setMsg(`Leave ${status.toLowerCase()}`);
    setMsgType("success");

    load();
  } catch (err) {
    setMsg(err?.response?.data?.message || "Action failed");
    setMsgType("error");
  }
};


  /* === UI === */
  return (
    <div className="space-y-10">

      {/* ALERT */}
      {msg && (
        <div
          className={`p-3 rounded-xl text-center text-sm ${
            msgType === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {msg}
        </div>
      )}

      <PageTitle title="Leaves" sub="Manage your leaves & WFH" />

      {/* ----- STAT CARDS ----- */}
      {!isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            icon={<FiCalendar className="text-blue-500" />}
            title="Total Leaves/WFH Applied"
            value={leaves.length}
          />
          <StatCard
            icon={<FiClock className="text-green-500" />}
            title="Approved Leaves or WFH Requests"
            value={leaves.filter((l) => l.status === "APPROVED").length}
          />
          <StatCard
            icon={<FiPlusCircle className="text-purple-500" />}
            title="WFH Requests"
            value={leaves.filter((l) => l.type === "WFH").length}
          />
        </div>
      )}

      {/* ----- APPLY SECTION (EMPLOYEE) ----- */}
      {!isAdmin && (
        <GlassCard>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Apply for Leave/WFH</h3>

            <button
              onClick={() => setShowTodayPopup(true)}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow"
            >
              Apply Today Leave/WFH
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Leave Type */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-gray-600">Leave Type</label>
              <select
                className="p-3 rounded-xl border dark:bg-gray-900 shadow"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="PAID">Paid Leave</option>
                <option value="UNPAID">Unpaid Leave</option>
                <option value="SICK">Sick Leave</option>
                <option value="CASUAL">Casual Leave</option>
                <option value="WFH">Work From Home</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-gray-600">Start Date</label>
              <input
                type="date"
                className="p-3 rounded-xl border dark:bg-gray-900 shadow"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-gray-600">End Date</label>
              <input
                type="date"
                className="p-3 rounded-xl border dark:bg-gray-900 shadow"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Reason */}
          <div className="mt-4">
            <label className="font-medium text-gray-600">Reason</label>
            <textarea
              rows={3}
              placeholder="Enter reason..."
              className="p-3 w-full rounded-xl border dark:bg-gray-900 shadow"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <button
            onClick={apply}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
          >
            Apply
          </button>
        </GlassCard>
      )}

      {/* ----- LEAVE LIST ----- */}
{/* ----- LEAVE LIST ----- */}
<GlassCard>
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-xl font-semibold">Your Leave/WFH History</h3>

    <span className="text-xs text-gray-500 dark:text-gray-400">
      Page {page} / {totalPages || 1}
    </span>
  </div>

  {loading ? (
    <div className="text-center py-6">Loading...</div>
  ) : paginatedLeaves.length === 0 ? (
    <p className="text-center text-gray-500 dark:text-gray-400">
      No leave history found
    </p>
  ) : (
    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
      {paginatedLeaves.map((l) => (
        <LeaveItem
          key={l.id}
          l={l}
          isAdmin={isAdmin}
          updateStatus={updateStatus}
        />
      ))}
    </div>
  )}

  {/* Pagination Buttons */}
  {totalPages > 1 && (
    <div className="flex justify-center gap-3 mt-4">
      <button
        disabled={page === 1}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm disabled:opacity-40"
      >
        ⬅ Previous
      </button>

      <button
        disabled={page === totalPages}
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm disabled:opacity-40"
      >
        Next ➜
      </button>
    </div>
  )}
</GlassCard>

      {/* ----- TODAY LEAVE POPUP ----- */}
      {showTodayPopup && (
        <TodayPopup
          todayForm={todayForm}
          setTodayForm={setTodayForm}
          close={() => setShowTodayPopup(false)}
          submit={submitTodayLeave}
        />
      )}
    </div>
  );
}

/* ========================== POPUP ========================== */
function TodayPopup({ todayForm, setTodayForm, close, submit }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-50 p-4">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-md w-full shadow-xl border border-gray-300 dark:border-gray-700">

        <h2 className="text-xl font-semibold mb-4">Apply Today Leave or WFH</h2>

        {/* Type */}
        <label className="font-medium text-gray-600 text-sm">Leave Type</label>
        <select
          className="p-3 w-full rounded-xl border dark:bg-gray-800 mt-1 mb-3"
          value={todayForm.type}
          onChange={(e) => setTodayForm({ ...todayForm, type: e.target.value })}
        >
          <option value="SICK">Sick Leave</option>
          <option value="CASUAL">Casual Leave</option>
          <option value="PAID">Paid Leave</option>
          <option value="UNPAID">Unpaid Leave</option>
          <option value="WFH">Work From Home</option>
        </select>

        {/* Reason */}
        <label className="font-medium text-gray-600 text-sm">Reason</label>
        <textarea
          className="p-3 w-full rounded-xl border dark:bg-gray-800 mt-1"
          rows={3}
          placeholder="Please mention your reason here..."
          value={todayForm.reason}
          onChange={(e) => setTodayForm({ ...todayForm, reason: e.target.value })}
        ></textarea>

        <div className="flex justify-end gap-3 mt-5">
          <button
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-xl"
            onClick={close}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl"
            onClick={submit}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================== SUB COMPONENTS ========================== */

function LeaveItem({ l, isAdmin, updateStatus }) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow flex justify-between items-center">
      <div>
        <div className="text-lg font-semibold">
          {l.type === "WFH" ? (
            <span className="text-blue-600">Work From Home</span>
          ) : l.type === "PAID" ? (
            <span className="text-green-600">Paid Leave</span>
          ) : l.type === "SICK" ? (
            <span className="text-yellow-600">Sick Leave</span>
          ) : (
            l.type
          )}
        </div>

        <div className="text-sm text-gray-500">
          {l.startDate?.slice(0, 10)} → {l.endDate?.slice(0, 10)}
        </div>

        {isAdmin && (
          <div className="text-xs text-gray-400">
            User: {l.user?.firstName} {l.user?.lastName}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`px-4 py-1 rounded-full text-white text-sm font-medium ${
            l.status === "APPROVED"
              ? "bg-green-600"
              : l.status === "REJECTED"
              ? "bg-red-600"
              : "bg-yellow-500"
          }`}
        >
          {l.status}
        </span>

        {isAdmin && l.status === "PENDING" && (
          <div className="flex gap-2">
            <button
              onClick={() => updateStatus(l.id, "APPROVED")}
              className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm"
            >
              Approve
            </button>
            <button
              onClick={() => updateStatus(l.id, "REJECTED")}
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PageTitle({ title, sub }) {
  return (
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-gray-500 dark:text-gray-400">{sub}</p>
    </div>
  );
}

function GlassCard({ children }) {
  return (
    <div className="p-6 rounded-2xl bg-white/60 dark:bg-gray-800/40 shadow border border-gray-200 dark:border-gray-700 backdrop-blur-lg">
      {children}
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 shadow border border-gray-200 dark:border-gray-700 flex items-center gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
  );
}
