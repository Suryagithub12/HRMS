import React, { useEffect, useState } from "react";
import api from "../api/axios";

const statusColor = {
  PENDING: "text-yellow-600 dark:text-yellow-400",
  APPROVED: "text-green-600 dark:text-green-400",
  REJECTED: "text-red-600 dark:text-red-400",
};

export default function AdminReimbursement() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      const res = await api.get("/reimbursement/all");
      setList(res.data.list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/reimbursement/${id}/status`, { status });
    loadAll();
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reimbursement?"))
      return;

    await api.delete(`/reimbursement/admin/${id}`);
    loadAll();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">

      <h1 className="text-2xl font-bold dark:text-white">
        Reimbursement Requests
      </h1>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow border dark:border-gray-700">

        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Loading...</p>
        ) : list.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">No requests</p>
        ) : (
          <div className="space-y-5">

            {list.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl border shadow dark:border-gray-700 dark:bg-gray-800 relative"
              >
                {/* DELETE BUTTON */}
                <button
                  onClick={() => deleteItem(r.id)}
                  className="absolute top-3 right-3 text-red-600 hover:text-red-800 font-bold text-xl"
                >
                  ✕
                </button>

                {/* HEADER */}
                <div className="flex justify-between items-center pr-8">
                  <div>
                    <h3 className="font-bold dark:text-white">{r.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {r.user?.firstName} ({r.user?.email})
                    </p>
                  </div>

                  <span className={`font-bold ${statusColor[r.status]}`}>
                    {r.status}
                  </span>
                </div>

                <p className="text-sm dark:text-gray-300 mt-1">
                  Total Amount: ₹{r.totalAmount}
                </p>

                {/* BILLS */}
                <div className="mt-3 space-y-1">
                  {r.bills.map((b) => (
                    <a
                      key={b.id}
                      href={b.fileUrl}
                      target="_blank"
                      className="text-blue-600 underline text-sm"
                    >
                      ₹{b.amount} — {b.note || "Bill"}
                    </a>
                  ))}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  {new Date(r.createdAt).toLocaleString()}
                </p>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 mt-4">
                  <button
                    disabled={r.status !== "PENDING"}
                    onClick={() => updateStatus(r.id, "APPROVED")}
                    className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-40"
                  >
                    Approve
                  </button>

                  <button
                    disabled={r.status !== "PENDING"}
                    onClick={() => updateStatus(r.id, "REJECTED")}
                    className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-40"
                  >
                    Reject
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
