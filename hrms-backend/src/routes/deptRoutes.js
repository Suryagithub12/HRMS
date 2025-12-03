import express from "express";
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from "../controllers/deptController.js";

import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

/* ----------------------------------------------
   LIST DEPARTMENTS
   ADMIN → All
   EMPLOYEE → Only their company
---------------------------------------------- */
router.get(
  "/",
  requireAuth(["ADMIN", "AGILITY_EMPLOYEE", "LYF_EMPLOYEE"]),
  listDepartments
);

/* ----------------------------------------------
   CREATE DEPARTMENT (ADMIN ONLY)
---------------------------------------------- */
router.post(
  "/",
  requireAuth(["ADMIN"]),
  createDepartment
);

/* ----------------------------------------------
   UPDATE DEPARTMENT (ADMIN ONLY)
---------------------------------------------- */
router.put(
  "/:id",
  requireAuth(["ADMIN"]),
  updateDepartment
);

/* ----------------------------------------------
   DELETE DEPARTMENT (ADMIN ONLY)
---------------------------------------------- */
router.delete(
  "/:id",
  requireAuth(["ADMIN"]),
  deleteDepartment
);

export default router;
