import prisma from "../prismaClient.js";

/* ==================== Helper ==================== */
const calcDays = (start, end) =>
  Math.floor((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;

/* ===================== RULES ===================== */
// 1. Comp-off leave apply only if balance >= required
// 2. On final approval → Balance deduct
// 3. Admin can grant manual comp-off
// 4. Used comp-off cannot be deleted
// 5. Leave once processed cannot be re-approved

/* ------------------------------------------------------------------
   1️⃣ Employee → Apply Comp-Off Leave (NO auto-approve)
------------------------------------------------------------------ */
export const applyCompOffLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start & End date required"
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const days = calcDays(startDate, endDate);

    if (user.compOffBalance < days) {
      return res.status(400).json({
        success: false,
        message: `Insufficient Comp-Off balance. Need ${days}, Available ${user.compOffBalance}`
      });
    }

    const leave = await prisma.leave.create({
      data: {
        userId: req.user.id,
        type: "COMP_OFF",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: "PENDING"
      }
    });

    return res.json({
      success: true,
      message: "Comp-Off leave request submitted",
      leave
    });

  } catch (e) {
    console.error("applyCompOffLeave:", e);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/* ------------------------------------------------------------------
   2️⃣ Admin/Manager → Approve / Reject Comp-Off Leave
------------------------------------------------------------------ */
export const approveCompOffLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!["APPROVED", "REJECTED"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action"
      });
    }

    const leave = await prisma.leave.findUnique({ where: { id } });
    if (!leave)
      return res.status(404).json({ success: false, message: "Leave not found" });

    if (leave.type !== "COMP_OFF") {
      return res.status(400).json({
        success: false,
        message: "Not a Comp-Off leave"
      });
    }

    // ❗ Prevent double processing
    if (leave.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Leave already processed"
      });
    }

    const days = calcDays(leave.startDate, leave.endDate);

    // ✅ Atomic transaction
    await prisma.$transaction(async (tx) => {
      if (action === "APPROVED") {
        const user = await tx.user.findUnique({
          where: { id: leave.userId }
        });

        if (user.compOffBalance < days) {
          throw new Error("Insufficient balance at approval time");
        }

        await tx.user.update({
          where: { id: leave.userId },
          data: { compOffBalance: { decrement: days } }
        });
      }

      await tx.leave.update({
        where: { id },
        data: {
          status: action,
          rejectReason: action === "REJECTED" ? reason || "" : null
        }
      });
    });

    return res.json({
      success: true,
      message: `Comp-Off ${action}`
    });

  } catch (e) {
    console.error("approveCompOffLeave:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Internal server error"
    });
  }
};

/* ------------------------------------------------------------------
   3️⃣ Admin → Grant Manual Comp-Off
------------------------------------------------------------------ */
export const grantCompOff = async (req, res) => {
  try {
    const { userId, workDate, duration = 1, note } = req.body;

    if (!userId || !workDate) {
      return res.status(400).json({
        success: false,
        message: "User & workDate required"
      });
    }

    const record = await prisma.compOff.create({
      data: {
        userId,
        workDate: new Date(workDate),
        duration,
        status: "APPROVED",
        note: note || "Extra work reward"
      }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { compOffBalance: { increment: duration } }
    });

    return res.json({
      success: true,
      message: "Comp-Off granted",
      record
    });

  } catch (e) {
    console.error("grantCompOff:", e);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/* ------------------------------------------------------------------
   4️⃣ Admin → List All Comp-Off Records
------------------------------------------------------------------ */
export const listCompOffRecords = async (req, res) => {
  try {
    const records = await prisma.compOff.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" }
    });

    return res.json({
      success: true,
      records
    });

  } catch (e) {
    console.error("listCompOffRecords:", e);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/* ------------------------------------------------------------------
   5️⃣ Admin → Delete Comp-Off + Revert Balance
------------------------------------------------------------------ */
export const deleteCompOff = async (req, res) => {
  try {
    const { id } = req.params;

    const rec = await prisma.compOff.findUnique({ where: { id } });
    if (!rec)
      return res.status(404).json({ success: false, message: "Record not found" });

    // ❗ Safety check
    if (rec.status === "USED") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete used Comp-Off"
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: rec.userId },
        data: { compOffBalance: { decrement: rec.duration } }
      });

      await tx.compOff.delete({ where: { id } });
    });

    return res.json({
      success: true,
      message: "Comp-Off deleted & balance reverted"
    });

  } catch (e) {
    console.error("deleteCompOff:", e);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
