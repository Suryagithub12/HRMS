import express from "express";
import {
  createLeave,
  listLeaves,
  approveLeave,
  updateLeave,
  deleteLeave,
  getLeaveById
} from "../controllers/leaveController.js";

import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

/* EMPLOYEE: Create Leave */
router.post(
  "/",
  requireAuth(["AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  createLeave
);

/* ADMIN + EMPLOYEE: List Leaves */
router.get(
  "/",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  listLeaves
);

/* ADMIN + EMPLOYEE: Get One Leave */
router.get(
  "/:id",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  getLeaveById
);

/* EMPLOYEE: update own leave + Admin: update any leave */
router.put(
  "/:id",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  updateLeave
);

/* ⭐ FIXED: Approve / Reject */
router.patch(
  "/:id/approve",
  requireAuth(["ADMIN"]),
  approveLeave
);

/* Delete Leave */
router.delete(
  "/:id",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  deleteLeave
);

export default router;
