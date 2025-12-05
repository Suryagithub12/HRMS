import React, { useEffect, useState } from "react";
import api from "../api/axios";
import useAuthStore from "../stores/authstore";
import {
  FiPlus,
  FiDownload,
  FiTrash2,
  FiUpload,
  FiFileText,
} from "react-icons/fi";
function EmployeeSelect({ value, onChange, employees }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Selected Box */}
      <div
        className="premium-input cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {value
          ? employees.find((emp) => emp.id === value)?.firstName +
            " " +
            employees.find((emp) => emp.id === value)?.lastName
          : "Select Employee"}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 mt-2 z-50 max-h-60 overflow-y-auto">
          {employees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => {
                onChange(emp.id);
                setOpen(false);
              }}
              className="px-4 py-2 hover:bg-indigo-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              {emp.firstName} {emp.lastName} ({emp.email})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
      PREMIUM PAYROLL PAGE
============================================================ */
export default function Payroll() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user.role === "ADMIN";

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);

  // NEW DELETE MODAL
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    userId: "",
    salaryMonth: "",
    baseSalary: "",
    bonus: "0",
    deductions: "0",
  });

  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");

  const [employees, setEmployees] = useState([]);

  /* Load Employee List */
  useEffect(() => {
    api.get("/users").then((r) => setEmployees(r.data.users || []));
  }, []);

  /* Auto-hide message */
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 2000);
    return () => clearTimeout(t);
  }, [msg]);

  /* Load Payrolls */
  const load = async () => {
    try {
      setLoading(true);
      const r = await api.get("/payroll");
      setList(r.data.payrolls || []);
    } catch (err) {
      setMsgType("error");
      setMsg(err.response?.data?.message || "Failed to load payrolls");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  /* Ask Delete */
  const askDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  /* Confirm Delete */
  const handleDelete = async () => {
    try {
      await api.delete(`/payroll/${deleteId}`);

      setMsg("Payroll deleted successfully");
      setMsgType("success");

      setConfirmOpen(false);
      setDeleteId(null);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Error deleting payroll");
      setMsgType("error");
    }
  };

  /* ============================================================
          CREATE PAYROLL
  ============================================================= */
  const openCreate = () => {
    setForm({
      userId: "",
      salaryMonth: "",
      baseSalary: "",
      bonus: "0",
      deductions: "0",
    });
    setModalOpen(true);
  };

  const submitCreate = async (e) => {
    e.preventDefault();

    if (!form.userId || !form.salaryMonth || !form.baseSalary) {
      setMsgType("error");
      setMsg("Employee, Month & Base Salary are required");
      return;
    }

    try {
      const payload = {
        userId: form.userId,
        salaryMonth: form.salaryMonth,
        baseSalary: Number(form.baseSalary),
        bonus: Number(form.bonus),
        deductions: Number(form.deductions),
      };

      await api.post("/payroll", payload);

      setMsgType("success");
      setMsg("Payroll created successfully");
      setModalOpen(false);
      load();
    } catch (err) {
      setMsgType("error");
      setMsg(err.response?.data?.message || "Failed to create");
    }
  };

  /* ============================================================
          GENERATE PDF
  ============================================================= */
 const requestGenerate = async (id) => {
  try {
    const res = await api.post(`/payroll/${id}/generate`);

    // 🔥 Only update this payroll in state (no jumping)
    setList((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, slipUrl: res.data.slipUrl } : p
      )
    );

    setMsgType("success");
    setMsg("Slip generated");

  } catch (err) {
    setMsgType("error");
    setMsg("Generate failed");
  }
};


  /* ============================================================
          UPLOAD PDF
  ============================================================= */
const handleUpload = async (id, file) => {
  if (!file) return;

  const fd = new FormData();
  fd.append("file", file);

  try {
    const res = await api.post(`/payroll/${id}/upload`, fd);

    // 🔥 Update slipUrl locally (no reload)
    setList((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, slipUrl: res.data.slipUrl } : p
      )
    );

    setMsgType("success");
    setMsg("Slip uploaded");
  } catch (err) {
    setMsgType("error");
    setMsg("Upload failed");
  }
};

  /* ============================================================
          DOWNLOAD
  ============================================================= */
  const download = async (p) => {
    if (p.slipUrl) {
      const clean = p.slipUrl.replace(/([^:]\/)\/+/g, "$1");
      return window.open(clean, "_blank");
    }

    try {
      const r = await api.get(`/payroll/${p.id}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([r.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${p.salaryMonth}.pdf`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      setMsgType("error");
      setMsg("Download failed");
    }
  };

  /* ============================================================
              UI
  ============================================================= */
  return (
    <div className="space-y-8">
      <PageTitle title="Payroll" sub="Premium Salary Slip Management" />

      {msg && (
        <div
          className={`p-3 rounded-xl text-sm shadow-sm ${
            msgType === "error"
              ? "bg-red-200 text-red-900"
              : "bg-green-200 text-green-900"
          }`}
        >
          {msg}
        </div>
      )}

      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={openCreate}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-xl shadow hover:shadow-lg transition-all flex items-center gap-2"
          >
            <FiPlus /> New Payroll
          </button>
        </div>
      )}

      <GlassCard>
        {loading ? (
          <div className="py-10 text-center text-gray-500 animate-pulse">
            Loading...
          </div>
        ) : list.length === 0 ? (
          <div className="py-6 text-gray-400">No payrolls found.</div>
        ) : (
          <div className="space-y-4">
            {list.map((p) => (
              <PayrollCard
                key={p.id}
                item={p}
                isAdmin={isAdmin}
                download={download}
                del={askDelete}    // FIXED
                requestGenerate={requestGenerate}
                handleUpload={handleUpload}
              />
            ))}
          </div>
        )}
      </GlassCard>
      {/* CREATE MODAL */}
      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)}>
          <CreatePayrollForm
            form={form}
            setForm={setForm}
            submit={submitCreate}
            employees={employees}
          />
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg max-w-sm w-full">

            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this payroll?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg"
              >
                No
              </button>

              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Yes, Delete
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
      PREMIUM PAYROLL CARD
============================================================ */
function PayrollCard({
  item,
  isAdmin,
  download,
  del,
  requestGenerate,
  handleUpload,
}) {
  return (
    <div className="
      p-5 rounded-2xl bg-white/80 dark:bg-gray-800/60 
      border border-gray-200 dark:border-gray-700 
      shadow-md hover:shadow-xl transition-all 
      backdrop-blur-xl

      flex flex-col md:flex-row 
      md:justify-between md:items-center 
      gap-4
    ">
      
      {/* LEFT SECTION */}
      <div className="flex-1">
        <div className="font-semibold text-lg text-gray-900 dark:text-white">
          {item.user?.firstName} {item.user?.lastName} —{" "}
          <span className="font-normal">
            {new Date(item.salaryMonth).toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Base: ₹{item.baseSalary} • Bonus: ₹{item.bonus} • Deductions: ₹
          {item.deductions}
        </div>

        <div className="font-bold text-indigo-600 dark:text-indigo-300 mt-1 text-lg">
          Net Salary: ₹{item.netSalary}
        </div>
      </div>

      {/* RIGHT SECTION (Buttons) */}
      <div className="
        flex flex-wrap 
        gap-2 
        justify-start md:justify-end
      ">
        <button
          onClick={() => download(item)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow flex items-center gap-2"
        >
          <FiDownload /> Slip
        </button>

        {isAdmin && (
          <>
            <label className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer shadow flex items-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              <FiUpload />
              <input
                type="file"
                className="hidden"
                accept="application/pdf"
                onChange={(e) => handleUpload(item.id, e.target.files?.[0])}
              />
              Upload
            </label>

            <button
              onClick={() => requestGenerate(item.id)}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow flex items-center gap-2"
            >
              <FiFileText /> Generate
            </button>

            <button
              onClick={() => del(item.id)}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow flex items-center gap-2"
            >
              <FiTrash2 /> Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
      CREATE PAYROLL FORM
============================================================ */
function CreatePayrollForm({ form, setForm, submit, employees }) {
  return (
    <>
      <h3 className="text-2xl font-semibold mb-5 text-gray-900 dark:text-gray-100">
        Create Payroll
      </h3>

      <form onSubmit={submit} className="space-y-6">
        {/* EMPLOYEE */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Employee
          </label>
<EmployeeSelect
  value={form.userId}
  onChange={(v) => setForm({ ...form, userId: v })}
  employees={employees}
/>
        </div>

        {/* MONTH */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Salary Month
          </label>

          <input
            type="month"
            className="premium-input"
            value={form.salaryMonth.replace("-01", "")}
            onChange={(e) =>
              setForm({ ...form, salaryMonth: e.target.value + "-01" })
            }
          />
        </div>

        {/* SALARY FIELDS */}
        <div className="grid grid-cols-3 gap-4">
          <FieldNumber
            label="Base Salary"
            value={form.baseSalary}
            onChange={(v) => setForm({ ...form, baseSalary: v })}
          />

          <FieldNumber
            label="Bonus"
            value={form.bonus}
            onChange={(v) => setForm({ ...form, bonus: v })}
          />

          <FieldNumber
            label="Deductions"
            value={form.deductions}
            onChange={(v) => setForm({ ...form, deductions: v })}
          />
        </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={() => setForm(form)}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition shadow"
          >
            Cancel
          </button>

          <button className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow hover:shadow-lg transition">
            Create
          </button>
        </div>
        {/* PREMIUM INPUT + SCROLLABLE SELECT */}
<style>{`
  .premium-input {
    width: 100%;
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(255,255,255,0.8);
    border: 1px solid #d1d5db;
    font-size: 15px;
    transition: 0.25s;
  }

  /* 🔥 Scrollable Select Dropdown */
  select.premium-input {
    max-height: 170px;
    overflow-y: auto;
  }

  option {
    padding: 8px;
  }

  .premium-input:focus {
    border-color: #6366f1;
    background: white;
    outline: none;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.25);
  }

  .dark .premium-input {
    background: rgba(31,41,55,0.8);
    border-color: #374151;
    color: white;
  }

  .dark .premium-input:focus {
    border-color: #818cf8;
    box-shadow: 0 0 0 3px rgba(129,140,248,0.25);
  }
`}</style>

      </form>
    </>
  );
}

/* ============================================================
      NUMBER FIELD
============================================================ */
function FieldNumber({ label, value, onChange }) {
  const validate = (e) => {
    let v = e.target.value;
    if (!/^\d*\.?\d*$/.test(v)) return;
    if (v.length > 1 && !v.startsWith("0.")) v = v.replace(/^0+/, "");
    onChange(v);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {label}
      </label>

      <input
        className="premium-input"
        placeholder="₹"
        value={value}
        onChange={validate}
      />
    </div>
  );
}

/* ============================================================
      PAGE TITLE
============================================================ */
function PageTitle({ title, sub }) {
  return (
    <div>
      <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        {title}
      </h1>
      <p className="text-gray-500 dark:text-gray-400">{sub}</p>
    </div>
  );
}

/* ============================================================
      GLASS CARD
============================================================ */
function GlassCard({ children }) {
  return (
    <div className="p-6 rounded-2xl bg-white/60 dark:bg-gray-800/50 shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-xl transition-all">
      {children}
    </div>
  );
}

/* ============================================================
      MODAL
============================================================ */
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-full max-w-xl shadow-2xl relative border border-gray-200 dark:border-gray-700 animate-scaleIn">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition text-xl"
        >
          ✕
        </button>

        {children}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0 }
          to { transform: scale(1); opacity: 1 }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out }
      `}</style>
    </div>
  );
}
