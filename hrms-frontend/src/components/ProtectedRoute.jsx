import React from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/authstore";

/**
 * ProtectedRoute
 * - Waits for Zustand loading to finish
 * - Ensures user + accessToken exist
 * - Validates allowed roles
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, accessToken, loading } = useAuthStore();

  /* -------------------------------------------------
     1️⃣ Still loading → show branded loader
  -------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen 
                      text-xl font-semibold text-gray-500 dark:text-gray-300">
        Authenticating...
      </div>
    );
  }

  /* -------------------------------------------------
     2️⃣ No user OR no token → Redirect to login
  -------------------------------------------------- */
  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  /* -------------------------------------------------
     3️⃣ Role validation
     If allowedRoles=[] → means route is PUBLIC for all logged-in users
  -------------------------------------------------- */
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  /* -------------------------------------------------
     4️⃣ All good → return protected view
  -------------------------------------------------- */
  return children;
}
