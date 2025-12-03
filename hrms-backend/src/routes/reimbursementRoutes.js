import express from "express";

import {
  uploadBills,
  uploadReimbursementFiles,
  createReimbursement,
  myReimbursements,
  getAllReimbursements,
  updateReimbursementStatus,
  employeeDeleteReimbursement,
  adminDeleteReimbursement,
} from "../controllers/reimbursementController.js";

import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

/* =====================================================
   UPLOAD BILL FILES (PDF / IMAGES)
===================================================== */
router.post(
  "/upload",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  uploadBills.array("files"),
  uploadReimbursementFiles
);

/* =====================================================
   EMPLOYEE ROUTES
===================================================== */

// Create new reimbursement
router.post(
  "/create",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  createReimbursement
);

// Get only logged-in employee's reimbursements
router.get(
  "/me",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  myReimbursements
);

// Employee soft-delete only their own item
router.delete(
  "/me/:id",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  employeeDeleteReimbursement
);

/* =====================================================
   ADMIN ROUTES
===================================================== */

// Admin sees all (except soft-deleted by admin)
router.get(
  "/all",
  requireAuth(["ADMIN"]),
  getAllReimbursements
);

// Admin change status
router.put(
  "/:id/status",
  requireAuth(["ADMIN"]),
  updateReimbursementStatus
);

// Admin soft-delete only for admin view
router.delete(
  "/admin/:id",
  requireAuth(["ADMIN"]),
  adminDeleteReimbursement
);

export default router;
