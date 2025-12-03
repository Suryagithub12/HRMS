import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { FiEdit, FiTrash2, FiPlus, FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

/* =======================================================
      EMPLOYEES PAGE
======================================================= */
export default function Employees() {
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();

  // Global message
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("success");

  // Confirm delete modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // Error
  const [errorMsg, setErrorMsg] = useState("");

  // Form
  const emptyForm = {
    firstName: "",
    lastName: "",
    email: "",
    role: "AGILITY_EMPLOYEE",
    departmentId: "",
    password: "",
  };
  const [form, setForm] = useState(emptyForm);

  /* Auto-hide message */
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 2000);
    return () => clearTimeout(t);
  }, [msg]);

  /* Load everything */
  const load = async () => {
    try {
      setLoading(true);

      const meRes = await api.get("/users/me");
      const usersRes = await api.get("/users");
      const deptRes = await api.get("/departments");

      setMe(meRes.data.user);
      setUsers(usersRes.data.users || []);
      setDepartments(deptRes.data.departments || []);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  /* Create/Edit */
  const openCreate = () => {
    setEditUser(null);
    setForm(emptyForm);
    setErrorMsg("");
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      departmentId: u.departmentId || "",
      password: "",
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  /* Save user */
  const submit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, form);
        setMsg("Employee updated successfully");
        setMsgType("success");
      } else {
        await api.post(`/users`, form);
        setMsg("Employee created successfully");
        setMsgType("success");
      }

      setModalOpen(false);
      load();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Error saving user");
    }
  };

  /* Ask for delete */
  const askDelete = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  /* Delete after confirm */
  const handleDelete = async () => {
    try {
      await api.delete(`/users/${deleteId}`);

      setMsg("Employee deleted successfully");
      setMsgType("success");

      setConfirmOpen(false);
      setDeleteId(null);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || "Error deleting");
      setMsgType("error");
    }
  };

  /* =======================================================
         UI
  ======================================================== */
  return (
    <div className="space-y-6">

      {msg && (
        <div
          className={
            `p-3 rounded-lg border ` +
            (msgType === "success"
              ? "bg-green-100 border-green-300 text-green-700"
              : "bg-red-100 border-red-300 text-red-700")
          }
        >
          {msg}
        </div>
      )}

      <PageTitle title="Employees" sub="Manage all employees" />

      <GlassCard>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Employee List</h3>

          {me?.role === "ADMIN" && (
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl flex items-center gap-2 hover:bg-indigo-700"
            >
              <FiPlus /> Add Employee
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-6">Loading...</div>
        ) : (
          <EmployeesTable
            users={users}
            askDelete={askDelete}
            openEdit={openEdit}
            me={me}
            departments={departments}
            navigate={navigate}
          />
        )}
      </GlassCard>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <Modal>
          <UserForm
            form={form}
            setForm={setForm}
            submit={submit}
            close={() => setModalOpen(false)}
            editUser={editUser}
            errorMsg={errorMsg}
            me={me}
            departments={departments}
               
          />
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg max-w-sm w-full">
            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>

            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this employee?
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

/* =======================================================
      SUB COMPONENTS
======================================================= */

function EmployeesTable({ users, askDelete, openEdit, me, departments, navigate }) {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b dark:border-gray-700">
          <th className="p-3">Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Department</th>
          {me?.role === "ADMIN" && <th className="text-right pr-3">Actions</th>}
        </tr>
      </thead>

      <tbody>
        {users.map((u) => (
          <tr
            key={u.id}
            onClick={() => navigate(`/employees/${u.id}`)}
            className="border-b dark:border-gray-800 hover:bg-gray-100/50 dark:hover:bg-gray-700/30"
          >
            <td className="p-3">{u.firstName} {u.lastName}</td>
            <td>{u.email}</td>
            <td>{u.role}</td>
            <td>{departments.find((d) => d.id === u.departmentId)?.name || "-"}</td>

            {me?.role === "ADMIN" && (
              <td className="flex justify-end gap-3 pr-3 py-2">
                <button
                  onClick={(e) =>{
                    e.stopPropagation();
                    openEdit(u)}}
                  className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                >
                  <FiEdit />
                </button>
                <button
                  onClick={() =>{
                    e.stopPropagation();
                    askDelete(u.id)}}
                  className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                >
                  <FiTrash2 />
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PageTitle({ title, sub }) {
  return (
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-gray-600 dark:text-gray-400">{sub}</p>
    </div>
  );
}

function GlassCard({ children }) {
  return (
    <div className="p-6 rounded-2xl bg-white/70 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 backdrop-blur-xl shadow">
      {children}
    </div>
  );
}

function Modal({ children }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-full max-w-lg shadow-xl">
        {children}
      </div>
    </div>
  );
}

function UserForm({ form, setForm, submit, close, editUser, errorMsg, me, departments }) {
  const [showPassword, setShowPassword] = useState(false);
  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <>
      <h3 className="text-2xl font-semibold mb-4">
        {editUser ? "Edit Employee" : "Add Employee"}
      </h3>

      {errorMsg && (
        <div className="p-3 mb-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="flex gap-3">
          <input
            className="input"
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
          />
          <input
            className="input"
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
          />
        </div>

        <input
          className="input"
          placeholder="Email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          disabled={!!editUser}
        />

        {me?.role === "ADMIN" && (
          <select
            className="input"
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
          >
            <option value="AGILITY_EMPLOYEE">Agility Employee</option>
            <option value="LYF_EMPLOYEE">Lyfshilp Employee</option>
            <option value="ADMIN">Admin</option>
          </select>
        )}

        <select
          className="input"
          value={form.departmentId}
          onChange={(e) => update("departmentId", e.target.value)}
        >
          <option value="">Select Department</option>
          {departments.map((dep) => (
            <option key={dep.id} value={dep.id}>
              {dep.name}
            </option>
          ))}
        </select>

        {!editUser && (
          <div className="relative">
            <input
              className="input pr-10"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300"
            >
              {showPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
            </button>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={close}
            className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-700"
          >
            Cancel
          </button>

          <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white">
            {editUser ? "Update" : "Create"}
          </button>
        </div>
      </form>

      <style>{`
        .input {
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          background: #f7f7f7;
          border: 1px solid #ddd;
        }
        .dark .input {
          background: #1f2937;
          border-color: #374151;
          color: white;
        }
      `}</style>
    </>
  );
}
