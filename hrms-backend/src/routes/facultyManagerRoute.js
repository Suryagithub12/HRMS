import { Router } from "express";
import {
  assignFreelanceFaculty,
  changeFacultyManager,
  checkFreelanceFacultyManager,
  createFreelanceFacultyManager,
  listFacultyManagers,
  listFreelanceFaculties,
  updateFreelanceFacultyStatus,
} from "../controllers/freelanceFacultyAdminController.js";
import {
  addClassesToDayEntry,
  addYoutubeLectureForFaculty,
  createBatch,
  createSubject,
  deleteBatch,
  deleteClass,
  deleteDayEntry,
  deleteSubject,
  getBatchById,
  getDayEntriesByDate,
  getDayEntryById,
  getFacultyEntriesInRange,
  getFacultyStats,
  getFacultySubjects,
  getFacultyYoutubeStats,
  getManagerFacultiesStats,
  getSubjectById,
  listBatches,
  listSubjects,
  listYoutubeLecturesForFaculty,
  updateBatch,
  updateClass,
  updateDayEntry,
  updateSubject,
  upsertDayEntry,
} from "../controllers/freelanceFacultyController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// ----------------------------- Admin only -----------------------------
router.post("/create", requireAuth(["ADMIN"]), createFreelanceFacultyManager);
router.get("/listFacultyMangers", requireAuth(["ADMIN"]), listFacultyManagers);
router.post("/assign", requireAuth(["ADMIN"]), assignFreelanceFaculty);
router.post("/listFacultiesUnderManager", requireAuth(["ADMIN"]), listFreelanceFaculties);
router.post("/updateStatus", requireAuth(["ADMIN"]), updateFreelanceFacultyStatus);
router.post("/updateManager", requireAuth(["ADMIN"]), changeFacultyManager);

// ----------------------------- Manager only -----------------------------
router.get("/facultyManager/me", requireAuth(["LYF_EMPLOYEE"]), checkFreelanceFacultyManager);
router.post("/managerFaculties", requireAuth(["LYF_EMPLOYEE"]), listFreelanceFaculties);

// ----------------------------- Stats (specific paths before /faculty/:faculty) -----------------------------
router.get("/faculty/:facultyId/stats", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), getFacultyStats);
router.get("/manager/faculties/stats", requireAuth(["LYF_EMPLOYEE"]), getManagerFacultiesStats);

// ----------------------------- Day entry & attendance -----------------------------
router.post("/faculty/:facultyId/entry", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), upsertDayEntry);
router.get("/faculty/:facultyId/entries", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), getFacultyEntriesInRange);
router.patch("/day-entry/:dayEntryId", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), updateDayEntry);
router.get("/day-entries", requireAuth(["LYF_EMPLOYEE"]), getDayEntriesByDate);
router.get("/day-entry/:dayEntryId", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), getDayEntryById);
router.delete("/faculty/:facultyId/entry/:dayEntryId",requireAuth(["LYF_EMPLOYEE"]),deleteDayEntry);

// ----------------------------- Classes -----------------------------
router.post("/day-entry/:dayEntryId/classes", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), addClassesToDayEntry);
router.patch("/classes/:classId", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), updateClass);
router.delete("/classes/:classId", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), deleteClass);

// ----------------------------- Batches -----------------------------
router.get("/batches", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), listBatches);
router.post("/batches", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), createBatch);
router.get("/batches/:batchId", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), getBatchById);
router.patch("/batches/:batchId", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), updateBatch);
router.delete("/batches/:batchId", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), deleteBatch);

// ----------------------------- Subjects -----------------------------
router.get("/subjects", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), listSubjects);
router.get("/faculty/:facultyId/subjects", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), getFacultySubjects);
router.post("/subjects", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), createSubject);
router.get("/subjects/:subjectId", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), getSubjectById);
router.patch("/subjects/:subjectId", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), updateSubject);
router.delete("/subjects/:subjectId", requireAuth(["ADMIN", "LYF_EMPLOYEE"]), deleteSubject);

// -------------------------- Youtube lectures -------------------------
router.post( "/freelance-faculty/:facultyId/youtube-lectures",requireAuth(["LYF_EMPLOYEE"]),addYoutubeLectureForFaculty);
router.get( "/freelance-faculty/:facultyId/youtube-lectures",requireAuth(["LYF_EMPLOYEE"]),listYoutubeLecturesForFaculty);
router.get(  "/freelance-faculty/:facultyId/youtube-stats",requireAuth(["ADMIN","LYF_EMPLOYEE"]),getFacultyYoutubeStats);

export default router;
