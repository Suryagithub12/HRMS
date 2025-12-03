// src/utils/hashUtil.js
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10; // recommended default

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
