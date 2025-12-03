import express from "express";
import { login } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";
import { revokeRefreshToken } from "../utils/tokenUtils.js";

const router = express.Router();

router.post("/login", login);

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await revokeRefreshToken(refreshToken);
  return res.json({ message: "Logged out" });
});

export default router;
