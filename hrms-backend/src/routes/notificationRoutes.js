import express from "express";
import {
  listNotifications,
  createNotification,
  markNotificationRead,
  deleteNotification,
  getNotificationById,
} from "../controllers/notificationController.js";

import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

/* -----------------------------------------------------
   LIST NOTIFICATIONS
   ADMIN → ALL
   EMPLOYEE → OWN ONLY
------------------------------------------------------ */
router.get(
  "/",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  listNotifications
);

/* -----------------------------------------------------
   GET SINGLE NOTIFICATION
   ADMIN → ANY
   EMPLOYEE → ONLY OWN
------------------------------------------------------ */
router.get(
  "/:id",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  getNotificationById
);

/* -----------------------------------------------------
   CREATE NOTIFICATION
   ONLY ADMIN
------------------------------------------------------ */
router.post(
  "/",
  requireAuth(["ADMIN"]),
  createNotification
);

/* -----------------------------------------------------
   MARK AS READ
   ❌ Admin cannot read
   ✔ Only Employees can mark as read
------------------------------------------------------ */
router.patch(
  "/:id/read",
  requireAuth(["AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  markNotificationRead
);

/* -----------------------------------------------------
   DELETE NOTIFICATION
   ADMIN → ANY
   EMPLOYEE → ONLY OWN
------------------------------------------------------ */
router.delete(
  "/:id",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  deleteNotification
);

export default router;
