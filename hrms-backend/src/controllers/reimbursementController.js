import prisma from "../prismaClient.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { sendRequestNotificationMail } from "../utils/sendMail.js";
import { getAdminAndManagers } from "../utils/getApprovers.js";
import { Parser } from "json2csv";
import ExcelJS from "exceljs";

/* =====================================================
   📦 STORAGE
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
   🔹 HELPERS
===================================================== */
const validateManagerReimbursementAccess = async (reimbursementId, managerId) => {
  const record = await prisma.reimbursement.findFirst({
    where: {
      id: reimbursementId,
      user: {
        departments: {
          some: {
            department: {
              managers: {
                some: { id: managerId },
              },
            },
          },
        },
      },
    },
  });

  if (!record) {
    throw new Error("Manager has no access to this reimbursement");
  }

  return record;
};

const getFullUrl = (file) => {
  const base ="https://www.agilityai.in";
  return `${base}/${file}`.replace(/([^:]\/)\/+/g, "$1");
};

const calculateTotal = (bills = []) =>
  bills.reduce((sum, b) => sum + Number(b.amount || 0), 0);

const validateOwner = async (id, userId) => {
  const record = await prisma.reimbursement.findFirst({
    where: { id, userId },
  });
  if (!record) throw new Error("Unauthorized access");
  return record;
};

const updateStatus = async ({ id, status, reason = null }) => {
  return prisma.reimbursement.update({
    where: { id },
    data: {
      status,
      rejectReason: status === "REJECTED" ? reason || "" : null,
    },
    include: {
      user: true, // 👈 IMPORTANT
    },
  });
};

/* =====================================================
   📤 UPLOAD BILL FILES
===================================================== */
export const uploadReimbursementFiles = async (req, res) => {
  try {
    if (!req.files?.length)
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });

    const files = req.files.map((f) => ({
      fileUrl: getFullUrl(`uploads/reimbursements/${f.filename}`),
    }));

    res.json({ success: true, files });
  } catch (e) {
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};

/* =====================================================
   👤 EMPLOYEE — CREATE
===================================================== */
export const createReimbursement = async (req, res) => {
  try {
    const { title, description, bills } = req.body;

    if (!title || !bills?.length)
      return res
        .status(400)
        .json({ success: false, message: "Title & bills required" });

    const reimbursement = await prisma.reimbursement.create({
      data: {
        userId: req.user.id,
        title,
        description: description || "",
        totalAmount: calculateTotal(bills),
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
/* ================= 📧 MAIL TO ADMIN + MANAGER ================= */
try {
  const approverEmails = await getAdminAndManagers(req.user.id);

  if (approverEmails.length > 0) {
    await sendRequestNotificationMail({
      to: approverEmails,
      subject: "New Reimbursement Request Submitted",
      title: "Reimbursement Request",
      employeeName: `${req.user.firstName} ${req.user.lastName}`,
      details: [
        `Title: ${title}`,
        `Total Amount: ₹${calculateTotal(bills)}`,
        description && `Description: ${description}`,
      ].filter(Boolean),
    });
  }
} catch (mailErr) {
  console.error("Reimbursement notification mail failed:", mailErr.message);
}
    res.json({
      success: true,
      message: "Reimbursement submitted",
      reimbursement,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   👤 EMPLOYEE — MY LIST
===================================================== */
export const myReimbursements = async (req, res) => {
  try {
    const list = await prisma.reimbursement.findMany({
      where: {
        userId: req.user.id,
        isEmployeeDeleted: false,
      },
      include: { bills: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, list });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

/* =====================================================
   👤 EMPLOYEE — SOFT DELETE
===================================================== */
export const employeeDeleteReimbursement = async (req, res) => {
  try {
    await validateOwner(req.params.id, req.user.id);

    await prisma.reimbursement.update({
      where: { id: req.params.id },
      data: { isEmployeeDeleted: true },
    });

    res.json({ success: true, message: "Removed from your list" });
  } catch (e) {
    res.status(403).json({ success: false, message: e.message });
  }
};

/* =====================================================
   👑 ADMIN — ALL || Manager-Department
===================================================== */
export const getManagerReimbursements = async (req, res) => {
  try {
    const managerId = req.user.id;

    const reimbursements = await prisma.reimbursement.findMany({
      where: {
        user: {
          departments: {
            some: {
              department: {
                managers: {
                  some: {
                    id: managerId,
                  },
                },
              },
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
          },
        },
        bills: true,          // ✅ bills
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      list: reimbursements,
    });
  } catch (err) {
    console.error("MANAGER REIMBURSEMENTS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getAllReimbursements = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN")
      return res.status(403).json({ success: false, message: "Admin only" });

    const list = await prisma.reimbursement.findMany({
      where: { isAdminDeleted: false },
      include: { user: true, bills: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, list });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

/* =====================================================
   👑 ADMIN — APPROVE / REJECT
===================================================== */
export const updateReimbursementStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const id = req.params.id;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    /* ================= 🔥 NEW PART ================= */

    // 1️⃣ Fetch reimbursement owner
    const record = await prisma.reimbursement.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Reimbursement not found",
      });
    }

    // 2️⃣ ❌ BLOCK SELF APPROVAL
    if (record.userId === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot approve or reject your own reimbursement",
      });
    }

    /* ================= ACCESS CONTROL ================= */

    if (req.user.role === "ADMIN") {
      // Admin → full access
    } else {
      // Manager → only department employees
      await validateManagerReimbursementAccess(id, req.user.id);
    }

    /* ================================================= */

    const reimbursement = await updateStatus({
      id,
      status,
      reason,
    });

    /* ================= 📧 MAIL TO EMPLOYEE ================= */
    try {
      await sendRequestNotificationMail({
        to: [reimbursement.user.email],
        subject: `Reimbursement ${status}`,
        title: "Reimbursement Status Update",
        employeeName: `${reimbursement.user.firstName} ${reimbursement.user.lastName}`,
        details: [
          `Title: ${reimbursement.title}`,
          `Amount: ₹${reimbursement.totalAmount}`,
          `Status: ${status}`,
          status === "REJECTED" && `Reason: ${reason || "Not specified"}`,
        ].filter(Boolean),
      });
    } catch (mailErr) {
      console.error("Reimbursement approve/reject mail failed:", mailErr.message);
    }

    return res.json({
      success: true,
      message: `Reimbursement ${status.toLowerCase()}`,
      reimbursement,
    });

  } catch (e) {
    console.error("updateReimbursementStatus ERROR:", e);
    return res.status(403).json({
      success: false,
      message: e.message,
    });
  }
};


/* =====================================================
   👑 ADMIN — SOFT DELETE
===================================================== */
export const adminDeleteReimbursement = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN")
      return res.status(403).json({ success: false, message: "Admin only" });

    await prisma.reimbursement.update({
      where: { id: req.params.id },
      data: { isAdminDeleted: true },
    });

    res.json({ success: true, message: "Removed from admin list" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};

/* =====================================================
   📤 EXPORT REIMBURSEMENTS (CSV / EXCEL)
===================================================== */

export const exportReimbursements = async (req, res) => {
  try {
    const user = req.user;
    const billUrls = (bills = []) =>
  bills.map((b) => b.fileUrl).join("\n");
    let { start, end, userId, departmentId, format } = req.query;
    if (!format) format = "csv";

    const where = {
      isAdminDeleted: false,
    };

    /* 🔐 ROLE BASED */
    if (user.role !== "ADMIN") {
      where.userId = user.id;
    } else if (userId) {
      where.userId = userId;
    }

    /* 📅 DATE FILTER */
    if (start && end) {
      where.createdAt = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    /* 🏢 DEPARTMENT FILTER */
    if (departmentId) {
      where.user = {
        departments: {
          some: {
            departmentId: departmentId,
          },
        },
      };
    }

    const rows = await prisma.reimbursement.findMany({
      where,
      include: {
        user: true,
        bills: true,
      },
      orderBy: { createdAt: "desc" },
    });

    /* ================= CSV ================= */
    if (format === "csv") {
      const parser = new Parser({
        fields: [
          "id",
          "user.firstName",
          "user.lastName",
          "title",
          "totalAmount",
          "status",
          "billUrls", 
          "createdAt",
        ],
      });

      const csv = parser.parse(
        filteredRows.map((r) => ({
          employee: `${r.user.firstName} ${r.user.lastName}`,
          title: r.title,
          totalAmount: r.totalAmount,
          status: r.status,
          billsCount: r.bills.length,
          billUrls: r.bills.map((b) => b.fileUrl).join(" | "),
          createdAt: r.createdAt.toISOString().split("T")[0],
        }))
      );

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=reimbursements.csv"
      );
      return res.send(csv);
    }

    /* ================= EXCEL ================= */
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reimbursements");

    sheet.columns = [
      { header: "Employee", key: "employee", width: 25 },
      { header: "Title", key: "title", width: 25 },
      { header: "Total Amount", key: "amount", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Bills Count", key: "bills", width: 15 },
      { header: "Bill URLs", key: "billUrls", width: 60 }, 
      { header: "Date", key: "date", width: 15 },
    ];

    rows.forEach((r) => {
      sheet.addRow({
        employee: `${r.user.firstName} ${r.user.lastName}`,
        title: r.title,
        amount: r.totalAmount,
        status: r.status,
        bills: r.bills.length,
        billUrls: billUrls(r.bills),
        date: r.createdAt.toISOString().split("T")[0],
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=reimbursements.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("[exportReimbursements ERROR]", err);
    return res.status(500).json({
      success: false,
      message: "Export failed",
    });
  }
};
