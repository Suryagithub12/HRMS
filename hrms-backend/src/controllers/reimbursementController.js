import prisma from "../prismaClient.js";
import multer from "multer";
import fs from "fs";
import path from "path";

/* =====================================================
   STORAGE (uploads/reimbursements)
===================================================== */
const uploadDir = path.join(process.cwd(), "uploads", "reimbursements");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

export const uploadBills = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      cb(null, `bill-${Date.now()}.${ext}`);
    },
  }),
});

/* =====================================================
   FULL URL
===================================================== */
const getFullUrl = (file) => {
  const base = process.env.SERVER_URL || "http://localhost:4000";
  return `${base}/${file}`.replace(/([^:]\/)\/+/g, "$1");
};

/* =====================================================
   UPLOAD MULTIPLE BILL FILES
===================================================== */
export const uploadReimbursementFiles = async (req, res) => {
  try {
    if (!req.files?.length)
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });

    const uploadedFiles = req.files.map((f) => ({
      fileUrl: getFullUrl(`uploads/reimbursements/${f.filename}`),
    }));

    return res.json({ success: true, files: uploadedFiles });
  } catch (err) {
    console.error("[uploadReimbursementFiles ERROR]", err);
    return res
      .status(500)
      .json({ success: false, message: "File upload failed" });
  }
};

/* =====================================================
   Create Reimbursement (EMPLOYEE)
===================================================== */
export const createReimbursement = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, bills } = req.body;

    if (!title || !bills || bills.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "Title & at least 1 bill required" });

    const totalAmount = bills.reduce(
      (sum, b) => sum + Number(b.amount || 0),
      0
    );

    const reimb = await prisma.reimbursement.create({
      data: {
        userId,
        title,
        description: description || "",
        totalAmount,
        bills: {
          create: bills.map((b) => ({
            fileUrl: b.fileUrl,
            amount: Number(b.amount),
            note: b.note || "",
          })),
        },
      },
      include: { bills: true },
    });

    return res.json({
      success: true,
      message: "Reimbursement submitted",
      reimbursement: reimb,
    });
  } catch (err) {
    console.error("[createReimbursement ERROR]", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   Employee — My Reimbursements (Filtered)
===================================================== */
export const myReimbursements = async (req, res) => {
  try {
    const userId = req.user.id;

    const list = await prisma.reimbursement.findMany({
      where: {
        userId,
        isEmployeeDeleted: false, // 🔥 Only employee-visible ones
      },
      include: { bills: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, list });
  } catch (err) {
    console.error("[myReimbursements ERROR]", err);
    return res.status(500).json({ success: false, message: "Failed" });
  }
};

/* =====================================================
   Employee — Soft DELETE only for employee
===================================================== */
export const employeeDeleteReimbursement = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const exists = await prisma.reimbursement.findFirst({
      where: { id, userId },
    });

    if (!exists)
      return res
        .status(403)
        .json({ success: false, message: "You cannot delete this entry" });

    await prisma.reimbursement.update({
      where: { id },
      data: { isEmployeeDeleted: true }, // 🔥 employee-only delete
    });

    return res.json({
      success: true,
      message: "Removed from your list",
    });
  } catch (err) {
    console.error("[employeeDeleteReimbursement ERROR]", err);
    return res.status(500).json({ success: false, message: "Failed" });
  }
};

/* =====================================================
   Admin — All Reimbursements (Filtered)
===================================================== */
export const getAllReimbursements = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN")
      return res.status(403).json({ success: false, message: "Admin only" });

    const list = await prisma.reimbursement.findMany({
      where: {
        isAdminDeleted: false, // 🔥 Admin hidden ones
      },
      include: { user: true, bills: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, list });
  } catch (err) {
    console.error("[getAllReimbursements ERROR]", err);
    return res.status(500).json({ success: false, message: "Failed" });
  }
};

/* =====================================================
   Admin — UPDATE STATUS
===================================================== */
export const updateReimbursementStatus = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN")
      return res.status(403).json({ success: false, message: "Admin only" });

    const { id } = req.params;
    const { status } = req.body;

    if (!["APPROVED", "REJECTED"].includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });

    const updated = await prisma.reimbursement.update({
      where: { id },
      data: { status },
    });

    return res.json({
      success: true,
      message: `Reimbursement ${status}`,
      reimbursement: updated,
    });
  } catch (err) {
    console.error("[updateReimbursementStatus ERROR]", err);
    return res.status(500).json({ success: false, message: "Failed" });
  }
};

/* =====================================================
   Admin — Soft DELETE only for Admin
===================================================== */
export const adminDeleteReimbursement = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN")
      return res.status(403).json({ success: false, message: "Admin only" });

    const { id } = req.params;

    await prisma.reimbursement.update({
      where: { id },
      data: { isAdminDeleted: true }, // 🔥 admin-only delete
    });

    return res.json({
      success: true,
      message: "Removed from admin list",
    });
  } catch (err) {
    console.error("[adminDeleteReimbursement ERROR]", err);
    return res.status(500).json({ success: false, message: "Failed to delete" });
  }
};