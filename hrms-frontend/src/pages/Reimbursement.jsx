import React from "react";
import useAuthStore from "../stores/authstore";

import EmployeeReimbursement from "./EmployeeReimbursement";
import AdminReimbursement from "./AdminReimbursement";

export default function Reimbursement() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return user.role === "ADMIN"
    ? <AdminReimbursement />
    : <EmployeeReimbursement />;
}
