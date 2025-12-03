import prisma from "../prismaClient.js";

/* ----------------------------------------------------
   LIST DEPARTMENTS (Role Based)
---------------------------------------------------- */
export const listDepartments = async (req, res) => {
  try {
    const user = req.user;

    let departments;

    const baseInclude = {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      },
      manager: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      }
    };

    // ADMIN → sees all departments
    if (user.role === "ADMIN") {
      departments = await prisma.department.findMany({
        include: baseInclude,
        orderBy: { name: "asc" },
      });

      return res.json({ success: true, departments });
    }

    // EMPLOYEE → sees only their department
    departments = await prisma.department.findMany({
      where: {
        users: { some: { id: user.id } }
      },
      include: baseInclude,
      orderBy: { name: "asc" }
    });

    return res.json({ success: true, departments });

  } catch (error) {
    console.error("listDepartments ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


/* ----------------------------------------------------
   CREATE DEPARTMENT
---------------------------------------------------- */
export const createDepartment = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admin can create departments"
      });
    }

    const { name, managerId } = req.body;

    if (!name)
      return res.status(400).json({
        success: false,
        message: "Name is required"
      });

    // Validate manager
    if (managerId) {
      const manager = await prisma.user.findUnique({ where: { id: managerId } });

      if (!manager)
        return res.status(400).json({
          success: false,
          message: "Manager not found"
        });

      if (manager.role === "ADMIN")
        return res.status(400).json({
          success: false,
          message: "Admin cannot be a department manager"
        });
    }

    const dep = await prisma.department.create({
      data: { name, managerId: managerId || null },
    });

    const department = await prisma.department.findUnique({
      where: { id: dep.id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: "Department created successfully",
      department
    });

  } catch (error) {
    console.error("createDepartment ERROR:", error);

    if (error.code === "P2002")
      return res.status(400).json({
        success: false,
        message: "Department name already exists"
      });

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


/* ----------------------------------------------------
   UPDATE DEPARTMENT
---------------------------------------------------- */
export const updateDepartment = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin only"
      });
    }

    const { id } = req.params;
    const { name, managerId } = req.body;

    // Validate manager
    if (managerId) {
      const manager = await prisma.user.findUnique({ where: { id: managerId } });

      if (!manager)
        return res.status(400).json({
          success: false,
          message: "Manager not found"
        });

      if (manager.role === "ADMIN")
        return res.status(400).json({
          success: false,
          message: "Admin cannot be a department manager"
        });
    }

    await prisma.department.update({
      where: { id },
      data: { name, managerId: managerId || null },
    });

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: "Department updated",
      department
    });

  } catch (error) {
    console.error("updateDepartment ERROR:", error);

    if (error.code === "P2002")
      return res.status(400).json({
        success: false,
        message: "Department name already exists"
      });

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


/* ----------------------------------------------------
   DELETE DEPARTMENT
---------------------------------------------------- */
export const deleteDepartment = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin only"
      });
    }

    const { id } = req.params;

    await prisma.department.delete({ where: { id } });

    return res.json({
      success: true,
      message: "Department deleted successfully"
    });

  } catch (error) {
    console.error("deleteDepartment ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
