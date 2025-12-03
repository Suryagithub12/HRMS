// routes/payrollRoutes.js
import express from "express";
import {
  getPayrolls,
  createPayroll,
  deletePayroll,
  generateSlip,
  uploadSlip,
  downloadSlip,
  upload,
  generatePayrollForAll
} from "../controllers/payrollController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

/* =====================================================
    GENERATE PAYROLL FOR ALL (ADMIN ONLY)
===================================================== */
router.post(
  "/generate-all",
  requireAuth(["ADMIN"]),
  generatePayrollForAll
);

/* Create Payroll (Admin) */
router.post("/", requireAuth(["ADMIN"]), createPayroll);

/* List Payrolls */
router.get(
  "/",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  getPayrolls
);

/* Delete Payroll */
router.delete("/:id", requireAuth(["ADMIN"]), deletePayroll);

/* Generate Slip */
router.post("/:id/generate", requireAuth(["ADMIN"]), generateSlip);

/* Upload Slip (PDF) */
router.post(
  "/:id/upload",
  requireAuth(["ADMIN"]),
  upload.single("file"),
  uploadSlip
);

/* Download Slip */
router.get(
  "/:id/download",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  downloadSlip
);

export default router;
