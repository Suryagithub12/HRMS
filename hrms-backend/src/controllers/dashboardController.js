import prisma from "../prismaClient.js";

/* =====================================================
   Helper: Today Range (00:00 → 23:59)
===================================================== */
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/* =====================================================
   DASHBOARD CONTROLLER
===================================================== */
export const dashboard = async (req, res) => {
  try {
    const user = req.user;

    /* =====================================================
       🔥 ADMIN DASHBOARD
    ====================================================== */
    if (user.role === "ADMIN") {
      const totalEmployees = await prisma.user.count({
        where: { role: { in: ["AGILITY_EMPLOYEE", "LYF_EMPLOYEE"] } }
      });

      const totalDepartments = await prisma.department.count();

      const deptWithUsers = await prisma.department.findMany({
        include: { users: true }
      });

      const deptStats = deptWithUsers.map((d) => ({
        name: d.name,
        count: d.users.length
      }));

      const { start, end } = getTodayRange();

      const todayAttendance = await prisma.attendance.findMany({
        where: { date: { gte: start, lte: end } },
        include: { user: true }
      });

      const presentToday = todayAttendance.filter((a) => a.checkIn).length;
      const wfhToday = todayAttendance.filter((a) => a.status === "WFH").length;
      const absentToday = totalEmployees - (presentToday + wfhToday);

      const leaveSummary = await prisma.leave.groupBy({
        by: ["status"],
        _count: { id: true }
      });

      const agilityEmployees = await prisma.user.count({
        where: { role: "AGILITY_EMPLOYEE" }
      });

      const lyfEmployees = await prisma.user.count({
        where: { role: "LYF_EMPLOYEE" }
      });

      const payrollLast = await prisma.payroll.findMany({
        orderBy: { salaryMonth: "desc" },
        take: 12
      });

      const payrollSummary = payrollLast.reduce(
        (acc, p) => {
          acc.totalBase += p.baseSalary;
          acc.totalBonus += p.bonus;
          acc.totalDeduction += p.deductions;
          acc.totalNet += p.netSalary;
          return acc;
        },
        { totalBase: 0, totalBonus: 0, totalDeduction: 0, totalNet: 0 }
      );

      const now = new Date();
      const last7 = new Date();
      last7.setDate(now.getDate() - 7);

      const attendanceTrend = await prisma.attendance.findMany({
        where: { date: { gte: last7, lte: now } },
        include: { user: true },
        orderBy: { date: "asc" }
      });

      const attendanceTrendFormatted = attendanceTrend.map((a) => ({
        ...a,
        dateFormatted: new Date(a.date).toLocaleDateString()
      }));

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const leavesTrend = await prisma.leave.findMany({
        where: { startDate: { gte: monthStart } },
        include: { user: true }
      });

      const leavesTrendFormatted = leavesTrend.map((l) => ({
        ...l,
        dateFormatted: new Date(l.startDate).toLocaleDateString()
      }));

      const leavesToday = await prisma.leave.findMany({
        where: {
          startDate: { lte: end },
          endDate: { gte: start }
        },
        include: { user: true }
      });

      const leavesTodayFormatted = leavesToday.map((l) => ({
        ...l,
        days:
          Math.floor(
            (new Date(l.endDate) - new Date(l.startDate)) /
            (1000 * 60 * 60 * 24)
          ) + 1,
        startDateFormatted: new Date(l.startDate).toLocaleDateString()
      }));

      const wfhTodayList = todayAttendance
        .filter((a) => a.status === "WFH")
        .map((a) => ({
          ...a,
          dateFormatted: new Date(a.date).toLocaleDateString()
        }));

      return res.json({
        success: true,
        admin: true,
        stats: {
          totalEmployees,
          totalDepartments,
          presentToday,
          wfhToday,
          absentToday,
          leaveSummary,
          payrollSummary,
          companyWise: {
            agility: agilityEmployees,
            lyfshilp: lyfEmployees
          },
          departments: deptStats,
          attendanceTrend: attendanceTrendFormatted,
          leavesTrend: leavesTrendFormatted,
          leavesToday: leavesTodayFormatted,
          wfhToday: wfhTodayList
        }
      });
    }

    /* =====================================================
       🔥 EMPLOYEE DASHBOARD  (FINAL + LEAVE/WFH FIX)
    ====================================================== */

    const uid = user.id;

    // Fetch raw attendance
    let myAttendance = await prisma.attendance.findMany({
      where: { userId: uid },
      orderBy: { date: "asc" }
    });

    const myLeaves = await prisma.leave.findMany({
      where: { userId: uid, status: "APPROVED" },
      orderBy: { startDate: "asc" }
    });

    // ⭐ Merge Leave + WFH days into attendance for calendar
    myLeaves.forEach((l) => {
      let cur = new Date(l.startDate);
      const end = new Date(l.endDate);

      while (cur <= end) {
        const iso = cur.toISOString().slice(0, 10);

        myAttendance.push({
          date: iso,
          checkIn: false,
          status: l.type === "WFH" ? "WFH" : "LEAVE"
        });

        cur.setDate(cur.getDate() + 1);
      }
    });

    // Sort final attendance list by date
    myAttendance.sort((a, b) => new Date(a.date) - new Date(b.date));

    // KPIs
    const presentDays = myAttendance.filter((a) => a.checkIn).length;
    const wfhDays = myAttendance.filter((a) => a.status === "WFH").length;

    const actualLeaves = myLeaves.filter((l) => l.type !== "WFH");
    const approvedLeaves = actualLeaves.filter((l) => l.status === "APPROVED").length;
    const pendingLeaves = actualLeaves.filter((l) => l.status === "PENDING").length;

    const myPayroll = await prisma.payroll.findMany({
      where: { userId: uid },
      orderBy: { salaryMonth: "desc" },
      take: 6
    });

    const now2 = new Date();
    const last7e = new Date();
    last7e.setDate(now2.getDate() - 7);

    const myTrend = await prisma.attendance.findMany({
      where: { userId: uid, date: { gte: last7e, lte: now2 } },
      orderBy: { date: "asc" }
    });

    return res.json({
      success: true,
      admin: false,
      stats: {
        presentDays,
        totalLeaves: actualLeaves.length,
        approvedLeaves,
        pendingLeaves,
        payrollHistory: myPayroll,
        attendanceTrend: myTrend,

        // ⭐ Calendar Ready Data
        attendance: myAttendance,
        wfhDays
      }
    });

  } catch (err) {
    console.error("dashboard ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
