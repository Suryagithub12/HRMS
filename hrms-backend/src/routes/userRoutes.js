import express from "express";
import {
  getMe,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  updateMyProfile,
  getUserFullDetails
} from "../controllers/userController.js";

import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

/* -----------------------------------------------------------
   GET Logged-in User Info
------------------------------------------------------------ */
router.get(
  "/me",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  getMe
);

/* -----------------------------------------------------------
   UPDATE MY OWN PROFILE
------------------------------------------------------------ */
router.patch(
  "/me/update",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  updateMyProfile
);

/* -----------------------------------------------------------
   LIST USERS
------------------------------------------------------------ */
router.get(
  "/",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  listUsers
);

/* -----------------------------------------------------------
   GET FULL USER DETAILS (ADMIN ONLY)
------------------------------------------------------------ */
router.get(
  "/:id/details",
  requireAuth(["ADMIN"]),
  getUserFullDetails
);

/* -----------------------------------------------------------
   CREATE USER (ADMIN ONLY)
------------------------------------------------------------ */
router.post(
  "/",
  requireAuth(["ADMIN"]),
  createUser
);

/* -----------------------------------------------------------
   UPDATE USER
------------------------------------------------------------ */
router.put(
  "/:id",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  updateUser
);

/* -----------------------------------------------------------
   DELETE USER (ADMIN ONLY)
------------------------------------------------------------ */
router.delete(
  "/:id",
  requireAuth(["ADMIN"]),
  deleteUser
);

export default router;
