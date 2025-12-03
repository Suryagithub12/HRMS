import jwt from "jsonwebtoken";
import prisma from "../config/db.js";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = async (user) => {
  const token = jwt.sign(
    { id: user.id },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  return token;
};
 