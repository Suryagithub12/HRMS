import React, { useEffect, useState } from "react";
import api from "../api/axios";
import useAuthStore from "../stores/authstore";

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  /* ----------------------
        LOAD PROFILE
  ----------------------- */
  const load = async () => {
    try {
      const r = await api.get("/users/me");
      setProfile(r.data.user);
    } catch (err) {
      setErrorMsg("Failed to load profile");
    }
  };

  useEffect(() => {
    load();
  }, []);

useEffect(() => {
  if (!errorMsg && !successMsg) return;

  const t = setTimeout(() => {
    setErrorMsg("");
    setSuccessMsg("");
  }, 2000);

  return () => clearTimeout(t);
}, [errorMsg, successMsg]);

const requestPassword = async () => {
  try {
    await api.post("/users/request-password-change"); // optional backend
    setSuccessMsg("Password change request sent to admin");
  } catch (err) {
    setErrorMsg("Failed to send request");
  }
};

  /* ----------------------
        SAVE PROFILE
  ----------------------- */
  const save = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await api.patch(`/users/me/update`, {
        firstName: profile.firstName,
        lastName: profile.lastName,
      });

      // Update Zustand Store
      setAuth(
        {
          ...user,
          firstName: profile.firstName,
          lastName: profile.lastName,
        },
        localStorage.getItem("hrms_access"),
        localStorage.getItem("hrms_refresh")
      );

      setSuccessMsg("Profile updated successfully");
      setEditing(false);
      load();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update profile");
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-8">
      <PageTitle title="Profile Settings" sub="Manage your account details" />

      {/* --- Messages --- */}
      {errorMsg && (
        <div className="p-3 bg-red-100 text-red-700 rounded">{errorMsg}</div>
      )}
      {successMsg && (
        <div className="p-3 bg-green-100 text-green-700 rounded">
          {successMsg}
        </div>
      )}

      {/* --- Profile Header --- */}
      <GlassCard>
        <div className="flex items-center gap-6">
          <img
            src={`https://ui-avatars.com/api/?name=${profile.firstName}`}
            className="w-20 h-20 rounded-full border shadow-lg"
            alt="Avatar"
          />

          <div>
            <h2 className="text-xl font-bold">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>
          </div>
        </div>
      </GlassCard>

      {/* --- Profile Form --- */}
      <GlassCard>
        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input
            className="input"
            value={profile.firstName}
            disabled={!editing}
            onChange={(e) =>
              setProfile({ ...profile, firstName: e.target.value })
            }
            placeholder="First Name"
          />

          <input
            className="input"
            value={profile.lastName || ""}
            disabled={!editing}
            onChange={(e) =>
              setProfile({ ...profile, lastName: e.target.value })
            }
            placeholder="Last Name"
          />

          <input
            className="input !bg-gray-200 dark:!bg-gray-700"
            value={profile.email}
            disabled
          />
        </div>

        <div className="flex gap-4 mt-6">
          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn-primary">
              Edit Profile
            </button>
          ) : (
            <>
              <button onClick={save} className="btn-success">
                Save
              </button>

              <button
                onClick={() => setEditing(false)}
                className="btn-gray"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </GlassCard>

      {/* --- Security ---
      <GlassCard>
        <h3 className="text-lg font-semibold mb-4">Security</h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Password changes are handled by admin.
        </p>

<button
  onClick={requestPassword}
  className="bg-red-600 text-white px-6 py-2 rounded-lg"
>
  Request Password Change
</button>

      </GlassCard> */}

      {/* Styles */}
      <style>{`
        .input {
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #ccc;
          background: #f8f8f8;
        }
        .dark .input {
          background: #1f2937;
          border-color: #374151;
          color: white;
        }

        .btn-primary {
          background: #4f46e5;
          padding: 10px 20px;
          color: white;
          border-radius: 8px;
        }
        .btn-success {
          background: #16a34a;
          padding: 10px 20px;
          color: white;
          border-radius: 8px;
        }
        .btn-gray {
          background: #6b7280;
          padding: 10px 20px;
          color: white;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}

/* Shared UI */
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
    <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/40 shadow border border-gray-200 dark:border-gray-700 backdrop-blur-xl">
      {children}
    </div>
  );
}
