import prisma from "../prismaClient.js";

// ---------- Helper: get manager record for current user (manager-only routes) ----------
async function getManagerRecord(userId) {
  const record = await prisma.freelanceFacultyManager.findUnique({
    where: { employeeId: userId },
  });
  return record;
}

// ---------- GET /faculty/:facultyId/stats ----------
export const getFacultyStats = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { from, to } = req.query; // Date range query parameters (YYYY-MM-DD)
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";

    // Build date filter for dayEntries
    const dateFilter = {};
    if (from || to) {
      dateFilter.date = {};
      if (from) {
        dateFilter.date.gte = new Date(from);
      }
      if (to) {
        // Include the entire day by setting to end of day
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.date.lte = toDate;
      }
    }

    const faculty = await prisma.freelanceFaculty.findUnique({
      where: { id: facultyId },
      include: {
        dayEntries: {
          where: dateFilter,
          include: { classes: true },
        },
        _count: {
          select: {
            dayEntries: {
              where: dateFilter,
            },
          },
        },
      },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }

    if (!isAdmin) {
      const manager = await getManagerRecord(userId);
      if (!manager || faculty.managerId !== userId) {
        return res.status(403).json({ success: false, message: "Not allowed" });
      }
    }

    const totalClasses = faculty.dayEntries.reduce((s, e) => s + (e.totalClasses ?? 0), 0);
    const totalDuration = faculty.dayEntries.reduce((s, e) => s + (e.totalDuration ?? 0), 0);
    const presentDays = faculty.dayEntries.filter((e) => e.isPresent).length;
    const absentDays = faculty.dayEntries.length - presentDays;

    return res.json({
      success: true,
      stats: {
        facultyId: faculty.id,
        name: faculty.name,
        totalDayEntries: faculty._count.dayEntries,
        totalClasses,
        totalDurationMinutes: totalDuration,
        presentDays,
        absentDays,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to get faculty stats" });
  }
};

// ---------- GET /manager/faculties/stats ----------
export const getManagerFacultiesStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const manager = await getManagerRecord(userId);
    if (!manager) {
      return res.status(403).json({ success: false, message: "Not a freelance faculty manager" });
    }

    const faculties = await prisma.freelanceFaculty.findMany({
      where: { managerId: userId },
      include: {
        _count: { select: { dayEntries: true } },
        dayEntries: {
          select: { totalClasses: true, totalDuration: true, isPresent: true },
        },
      },
    });

    const stats = faculties.map((f) => {
      const totalClasses = f.dayEntries.reduce((s, e) => s + (e.totalClasses ?? 0), 0);
      const totalDuration = f.dayEntries.reduce((s, e) => s + (e.totalDuration ?? 0), 0);
      const presentDays = f.dayEntries.filter((e) => e.isPresent).length;
      return {
        facultyId: f.id,
        name: f.name,
        status: f.status,
        totalDayEntries: f._count.dayEntries,
        totalClasses,
        totalDurationMinutes: totalDuration,
        presentDays,
      };
    });

    return res.json({ success: true, stats });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to get manager faculties stats" });
  }
};

// ---------- POST /faculty/:facultyId/entry (upsert day entry + attendance) ----------
export const upsertDayEntry = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { date, isPresent, remarks } = req.body;
    const userId = req.user.id;

    if (!date) {
      return res.status(400).json({ success: false, message: "date is required (YYYY-MM-DD)" });
    }

    const faculty = await prisma.freelanceFaculty.findUnique({
      where: { id: facultyId },
    });
    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }

    const manager = await getManagerRecord(userId);
    const isAdmin = req.user?.role === "ADMIN";
    if (!isAdmin && (!manager || faculty.managerId !== userId)) {
      return res.status(403).json({ success: false, message: "Not allowed to add entry for this faculty" });
    }

    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    const entry = await prisma.dayEntry.upsert({
      where: {
        facultyId_date: { facultyId, date: dateOnly },
      },
      create: {
        facultyId,
        date: dateOnly,
        isPresent: isPresent !== false,
        remarks: remarks ?? null,
        createdBy: userId,
      },
      update: {
        isPresent: isPresent !== false,
        remarks: remarks ?? null,
      },
      include: { faculty: { select: { id: true, name: true } }, classes: true },
    });

    return res.status(200).json({ success: true, entry });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to upsert day entry" });
  }
};

// ---------- PATCH /day-entry/:dayEntryId ----------
export const updateDayEntry = async (req, res) => {
  try {
    const { dayEntryId } = req.params;
    const { isPresent, remarks } = req.body;
    const userId = req.user.id;

    const dayEntry = await prisma.dayEntry.findUnique({
      where: { id: dayEntryId },
      include: { faculty: true },
    });
    if (!dayEntry) {
      return res.status(404).json({ success: false, message: "Day entry not found" });
    }

    const manager = await getManagerRecord(userId);
    const isAdmin = req.user?.role === "ADMIN";
    if (!isAdmin && (!manager || dayEntry.faculty.managerId !== userId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const updated = await prisma.dayEntry.update({
      where: { id: dayEntryId },
      data: {
        ...(typeof isPresent === "boolean" && { isPresent }),
        ...(remarks !== undefined && { remarks }),
      },
      include: { faculty: { select: { id: true, name: true } }, classes: true },
    });

    return res.json({ success: true, entry: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to update day entry" });
  }
};

// ---------- GET /faculty/:facultyId/entries?from=...&to=... ----------
export const getFacultyEntriesInRange = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { from, to } = req.query;
    const userId = req.user.id;

    const faculty = await prisma.freelanceFaculty.findUnique({
      where: { id: facultyId },
    });
    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }

    const manager = await getManagerRecord(userId);
    const isAdmin = req.user?.role === "ADMIN";
    if (!isAdmin && (!manager || faculty.managerId !== userId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const where = { facultyId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const entries = await prisma.dayEntry.findMany({
      where,
      orderBy: { date: "desc" },
      include: { classes: { include: { batch: true, subject: true } } },
    });

    return res.json({ success: true, entries });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to get entries" });
  }
};

// ---------- GET /day-entries?date=YYYY-MM-DD ----------
export const getDayEntriesByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;

    if (!date) {
      return res.status(400).json({ success: false, message: "Query param date is required (YYYY-MM-DD)" });
    }

    const manager = await getManagerRecord(userId);
    if (!manager) {
      return res.status(403).json({ success: false, message: "Not a freelance faculty manager" });
    }

    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    const entries = await prisma.dayEntry.findMany({
      where: {
        date: dateOnly,
        faculty: { managerId: userId },
      },
      orderBy: { faculty: { name: "asc" } },
      include: {
        faculty: { select: { id: true, name: true, subjects: true } },
        classes: { include: { batch: true, subject: true } },
      },
    });

    return res.json({ success: true, entries });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to get day entries" });
  }
};

// ---------- GET /day-entry/:dayEntryId ----------
export const getDayEntryById = async (req, res) => {
  try {
    const { dayEntryId } = req.params;
    const userId = req.user.id;

    const entry = await prisma.dayEntry.findUnique({
      where: { id: dayEntryId },
      include: {
        faculty: true,
        classes: { include: { batch: true, subject: true } },
      },
    });
    if (!entry) {
      return res.status(404).json({ success: false, message: "Day entry not found" });
    }

    const manager = await getManagerRecord(userId);
    const isAdmin = req.user?.role === "ADMIN";
    if (!isAdmin && (!manager || entry.faculty.managerId !== userId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    return res.json({ success: true, entry });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to get day entry" });
  }
};

// ---------- POST /day-entry/:dayEntryId/classes ----------
export const addClassesToDayEntry = async (req, res) => {
  try {
    const { dayEntryId } = req.params;
    const { classes: classesPayload } = req.body;
    const userId = req.user.id;

    const dayEntry = await prisma.dayEntry.findUnique({
      where: { id: dayEntryId },
      include: { faculty: true, classes: true },
    });
    if (!dayEntry) {
      return res.status(404).json({ success: false, message: "Day entry not found" });
    }

    const manager = await getManagerRecord(userId);
    const isAdmin = req.user?.role === "ADMIN";
    if (!isAdmin && (!manager || dayEntry.faculty.managerId !== userId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const list = Array.isArray(classesPayload) ? classesPayload : [classesPayload];
    if (list.length === 0) {
      return res.status(400).json({ success: false, message: "At least one class is required" });
    }

    const created = [];
    let totalDuration = dayEntry.totalDuration;
    let totalClasses = dayEntry.totalClasses;

    for (const c of list) {
      const { batchId, subjectId, topic, startTime, endTime, duration, notes } = c;
      if (!batchId || !subjectId || !topic || startTime == null || endTime == null || duration == null) {
        return res.status(400).json({ success: false, message: "batchId, subjectId, topic, startTime, endTime, duration required" });
      }
      const cls = await prisma.class.create({
        data: {
          dayEntryId,
          batchId,
          subjectId,
          topic,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          duration: Number(duration),
          notes: notes ?? null,
        },
        include: { batch: true, subject: true },
      });
      created.push(cls);
      totalDuration += cls.duration;
      totalClasses += 1;
    }

    await prisma.dayEntry.update({
      where: { id: dayEntryId },
      data: { totalClasses, totalDuration },
    });

    return res.status(201).json({ success: true, classes: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to add classes" });
  }
};

// ---------- PATCH /classes/:classId ----------
export const updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { topic, startTime, endTime, duration, notes } = req.body;
    const userId = req.user.id;

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: { dayEntry: { include: { faculty: true } } },
    });
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const manager = await getManagerRecord(userId);
    const isAdmin = req.user?.role === "ADMIN";
    if (!isAdmin && (!manager || cls.dayEntry.faculty.managerId !== userId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const data = {};
    if (topic !== undefined) data.topic = topic;
    if (startTime !== undefined) data.startTime = new Date(startTime);
    if (endTime !== undefined) data.endTime = new Date(endTime);
    if (duration !== undefined) data.duration = Number(duration);
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.class.update({
      where: { id: classId },
      data,
      include: { batch: true, subject: true, dayEntry: { select: { id: true, date: true } } },
    });

    return res.json({ success: true, class: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to update class" });
  }
};

// ---------- DELETE /classes/:classId ----------
export const deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: { dayEntry: { include: { faculty: true } } },
    });
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const manager = await getManagerRecord(userId);
    const isAdmin = req.user?.role === "ADMIN";
    if (!isAdmin && (!manager || cls.dayEntry.faculty.managerId !== userId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    await prisma.class.delete({ where: { id: classId } });

    await prisma.dayEntry.update({
      where: { id: cls.dayEntryId },
      data: {
        totalClasses: { decrement: 1 },
        totalDuration: { decrement: cls.duration },
      },
    });

    return res.json({ success: true, message: "Class deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to delete class" });
  }
};

// ---------- Batches ----------
export const listBatches = async (req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return res.json({ success: true, batches });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to list batches" });
  }
};

export const createBatch = async (req, res) => {
  try {
    const { name, code, description, startDate, endDate } = req.body;
    if (!name || !startDate) {
      return res.status(400).json({ success: false, message: "name and startDate are required" });
    }
    const batch = await prisma.batch.create({
      data: {
        name,
        code: code || null,
        description: description || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    return res.status(201).json({ success: true, batch });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to create batch" });
  }
};

export const getBatchById = async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { classes: true },
    });
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }
    return res.json({ success: true, batch });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to get batch" });
  }
};

export const updateBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { name, code, description, startDate, endDate, isActive } = req.body;
    const batch = await prisma.batch.update({
      where: { id: batchId },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(description !== undefined && { description }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return res.json({ success: true, batch });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to update batch" });
  }
};

export const deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    await prisma.batch.delete({ where: { id: batchId } });
    return res.json({ success: true, message: "Batch deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to delete batch" });
  }
};

// ---------- Subjects ----------
export const listSubjects = async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
    });
    return res.json({ success: true, subjects });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to list subjects" });
  }
};

export const createSubject = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: "name and code are required" });
    }
    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        description: description || null,
      },
    });
    return res.status(201).json({ success: true, subject });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to create subject" });
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { classes: true },
    });
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }
    return res.json({ success: true, subject });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to get subject" });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { name, code, description } = req.body;
    const subject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(description !== undefined && { description }),
      },
    });
    return res.json({ success: true, subject });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to update subject" });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    await prisma.subject.delete({ where: { id: subjectId } });
    return res.json({ success: true, message: "Subject deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to delete subject" });
  }
};

// ---------- Get subjects for a faculty (ensure they exist in Subject table) ----------
export const getFacultySubjects = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "ADMIN";

    const faculty = await prisma.freelanceFaculty.findUnique({
      where: { id: facultyId },
      select: { id: true, subjects: true, managerId: true },
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty not found" });
    }

    if (!isAdmin) {
      const manager = await getManagerRecord(userId);
      if (!manager || faculty.managerId !== userId) {
        return res.status(403).json({ success: false, message: "Not allowed" });
      }
    }

    if (!faculty.subjects || !Array.isArray(faculty.subjects) || faculty.subjects.length === 0) {
      return res.json({ success: true, subjects: [] });
    }

    // Get all existing subjects
    const existingSubjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
    });

    // Normalize existing subject names for matching
    const existingSubjectNames = new Set(
      existingSubjects.map((s) => s.name.trim().toLowerCase())
    );

    // Ensure all faculty subjects exist in Subject table
    const subjectResults = [];
    for (const subjectName of faculty.subjects) {
      const normalizedName = subjectName.trim().toLowerCase();
      let subject = existingSubjects.find(
        (s) => s.name.trim().toLowerCase() === normalizedName
      );

      // If subject doesn't exist, create it
      if (!subject) {
        // Generate a code from the subject name
        const code = subjectName
          .trim()
          .toUpperCase()
          .replace(/\s+/g, "_")
          .substring(0, 20);
        
        try {
          subject = await prisma.subject.create({
            data: {
              name: subjectName.trim(),
              code: code,
            },
          });
          // Add to existingSubjects to avoid duplicate creation attempts
          existingSubjects.push(subject);
        } catch (createErr) {
          // If code already exists, try with a unique suffix
          if (createErr.code === "P2002") {
            const uniqueCode = `${code}_${Date.now().toString().slice(-6)}`;
            try {
              subject = await prisma.subject.create({
                data: {
                  name: subjectName.trim(),
                  code: uniqueCode,
                },
              });
              existingSubjects.push(subject);
            } catch (retryErr) {
              console.error(`Failed to create subject ${subjectName} with unique code:`, retryErr);
              continue;
            }
          } else {
            console.error(`Failed to create subject ${subjectName}:`, createErr);
            continue;
          }
        }
      }

      subjectResults.push(subject);
    }

    return res.json({ success: true, subjects: subjectResults });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to get faculty subjects" });
  }
};


// ================Freelance faculty youtube controller=======================
export const addYoutubeLectureForFaculty=async(req,res)=>{
  try{
    const { facultyId } = req.params;
    const { date, youtubeUrl, title, description, meta } = req.body;

    if (!facultyId || !date || !youtubeUrl) {
      return res.status(400).json({
        success: false,
        message: "facultyId, date and youtubeUrl are required",
      });
    }

    // Basic URL validation
    if (!/^https?:\/\/(www\.)?youtube\.com\/|^https?:\/\/youtu\.be\//.test(youtubeUrl)) {
      return res.status(400).json({
        success: false,
        message: "Invalid YouTube URL",
      });
    }

    // Ensure faculty exists
    const faculty = await prisma.freelanceFaculty.findUnique({
      where: { id: facultyId },
    });
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    const lecture = await prisma.youtubeLecture.create({
      data: {
        facultyId,
        date: new Date(date),
        youtubeUrl: youtubeUrl.trim(),
        title: title?.trim() || null,
        description: description?.trim() || null,
        meta: meta ?? undefined,
      },
    });

    // Count after insert
    const count = await prisma.youtubeLecture.count({
      where: { facultyId },
    });

    return res.status(201).json({
      success: true,
      message: "YouTube lecture added successfully",
      lecture,
      youtubeLectureCount: count,
    });

  }catch(err){
    console.log(err);
    return res.status(500).json({
      success:false,
      error:err
    })
  }
}

// =====================list freelance faculty videos=========================
export const listYoutubeLecturesForFaculty=async (req,res)=>{
  try{
    const { facultyId } = req.params;
    const { from, to } = req.query;

    if (!facultyId) {
      return res.status(400).json({
        success: false,
        message: "facultyId is required",
      });
    }

    const faculty = await prisma.freelanceFaculty.findUnique({
      where: { id: facultyId },
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    // Reuse your manager/admin access pattern if needed (similar to other handlers)

    const where = { facultyId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const lectures = await prisma.youtubeLecture.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return res.status(200).json({
      success: true,
      lectures,
      count: lectures.length, // 👈 count for the given range (e.g. "this month")
    });

  }catch(err){
    console.error("listYoutubeLecturesForFaculty error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load YouTube lectures for this faculty",
    });
  }
}

// ===============get faculty youtube stats including count==================
export const getFacultyYoutubeStats=async (req,res)=>{
  try {
    const { facultyId } = req.params;

    const [faculty, lectureCount] = await Promise.all([
      prisma.freelanceFaculty.findUnique({ where: { id: facultyId } }),
      prisma.youtubeLecture.count({ where: { facultyId } }),
    ]);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    return res.status(200).json({
      success: true,
      facultyId,
      youtubeLectureCount: lectureCount,
    });
  } catch (err) {
    console.error("getFacultyYoutubeStats error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load YouTube lecture stats",
    });
  }
  }

  // -------------------Delete Faculty Entry-----------------
  export const deleteDayEntry= async (req,res)=>{
    try{
      const {facultyId,dayEntryId}=req.params;
      const userId=req.user.id;

      // Find the entry with faculty relation
    const entry = await prisma.dayEntry.findUnique({
      where: { id: dayEntryId },
      include: { faculty: true }
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: "Entry not found" });
    }

    // Verify faculty matches
    if (entry.facultyId !== facultyId) {
      return res.status(400).json({ success: false, message: "Entry does not belong to this faculty" });
    }

     // Delete the entry (cascade will handle classes deletion)
     await prisma.dayEntry.delete({ where: { id: dayEntryId } });

     return res.json({ success: true, message: "Entry deleted successfully" });

    }catch(err){
      console.log("Something went wrong in deleteDayEntry controller:",err)
      return res.status(500).json({
        success:false,
        error:err
      })
    }
  }