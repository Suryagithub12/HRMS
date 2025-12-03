import express from "express";
import { dashboard } from "../controllers/dashboardController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

/**
 * ADMIN → FULL DASHBOARD
 * EMPLOYEE → PERSONAL DASHBOARD
 */
router.get(
  "/",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  dashboard
);

export default router;
