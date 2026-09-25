import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import pool from "../db.js";
import { authMiddleware } from "../middleware/auth.js";
import { sendOTPEmail } from "../utils/email.js";

const router = Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "882954428096-pt2dqpejijgg0l4r1u5u5mdb24pld6n3.apps.googleusercontent.com";
const JWT_SECRET = process.env.JWT_SECRET || "comicstore_jwt_secret_key_2026_ptit";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Mật khẩu tối thiểu 6 ký tự" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email đã được sử dụng" });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, 'BUYER') RETURNING id, email, name, role, avatar, created_at",
      [email, name, hash]
    );

    const user = result.rows[0];

    // Send verification OTP
    const otp = generateOTP();
    await pool.query(
      "INSERT INTO otp_codes (user_id, code, type, expires_at) VALUES ($1, $2, 'EMAIL_VERIFY', NOW() + INTERVAL '10 minutes')",
      [user.id, otp]
    );
    try {
      await sendOTPEmail(email, otp, "EMAIL_VERIFY");
    } catch (e) {
      console.error("Email send failed:", e.message);
    }

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Vui lòng điền email và mật khẩu" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      return res.status(401).json({ error: "Tài khoản này sử dụng Google để đăng nhập" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không đúng" });
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Google OAuth
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    const decoded = jwt.decode(credential);
    const validAudiences = [
      decoded?.aud,
      GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_ID,
      "882954428096-pt2dqpejijgg0l4r1u5u5mdb24pld6n3.apps.googleusercontent.com",
      "504369620008-sa70jccb91mga9ug551i8954pr6ee3e0.apps.googleusercontent.com",
    ].filter(Boolean);

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: validAudiences,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists by google_id or email
    let result = await pool.query(
      "SELECT * FROM users WHERE google_id = $1 OR email = $2",
      [googleId, email]
    );

    let user;
    if (result.rows.length > 0) {
      user = result.rows[0];
      // Update google_id if logging in with email that already exists
      if (!user.google_id) {
        await pool.query("UPDATE users SET google_id = $1, avatar = $2, is_verified = TRUE WHERE id = $3", [googleId, picture, user.id]);
        user.google_id = googleId;
        user.avatar = picture;
      }
    } else {
      result = await pool.query(
        "INSERT INTO users (email, name, google_id, avatar, role, is_verified) VALUES ($1, $2, $3, $4, 'BUYER', TRUE) RETURNING *",
        [email, name, googleId, picture]
      );
      user = result.rows[0];
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token, isNewUser: !safeUser.phone || !safeUser.address });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Xác thực Google thất bại: " + (err.message || "") });
  }
});

// Verify Email OTP
router.post("/verify-email", authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const result = await pool.query(
      "SELECT * FROM otp_codes WHERE user_id = $1 AND code = $2 AND type = 'EMAIL_VERIFY' AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [req.user.id, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Mã OTP không hợp lệ hoặc đã hết hạn" });
    }

    await pool.query("UPDATE otp_codes SET used = TRUE WHERE id = $1", [result.rows[0].id]);
    await pool.query("UPDATE users SET is_verified = TRUE WHERE id = $1", [req.user.id]);

    res.json({ message: "Xác nhận email thành công" });
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Forgot Password - Send OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const result = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      // Don't reveal if email exists
      return res.json({ message: "Nếu email tồn tại, mã OTP đã được gửi" });
    }

    const otp = generateOTP();
    await pool.query(
      "INSERT INTO otp_codes (user_id, code, type, expires_at) VALUES ($1, $2, 'PASSWORD_RESET', NOW() + INTERVAL '10 minutes')",
      [result.rows[0].id, otp]
    );

    await sendOTPEmail(email, otp, "PASSWORD_RESET");
    res.json({ message: "Mã OTP đã được gửi đến email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Reset Password with OTP
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Thiếu thông tin" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Mật khẩu tối thiểu 6 ký tự" });
    }

    const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "Mã OTP không hợp lệ" });
    }

    const otpResult = await pool.query(
      "SELECT * FROM otp_codes WHERE user_id = $1 AND code = $2 AND type = 'PASSWORD_RESET' AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [userResult.rows[0].id, code]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: "Mã OTP không hợp lệ hoặc đã hết hạn" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, userResult.rows[0].id]);
    await pool.query("UPDATE otp_codes SET used = TRUE WHERE id = $1", [otpResult.rows[0].id]);

    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Change Password
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Thiếu thông tin" });
    }

    const result = await pool.query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    const user = result.rows[0];

    if (!user.password_hash) {
      return res.status(400).json({ error: "Tài khoản Google không thể đổi mật khẩu" });
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: "Mật khẩu hiện tại không đúng" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, req.user.id]);

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Get current user profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, name, role, avatar, is_verified, google_id, phone, address, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Update user profile (Name, Phone, Address, Avatar)
router.patch("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, phone, address, avatar } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Họ và tên không được để trống" });
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = $1, 
           phone = $2, 
           address = $3, 
           avatar = COALESCE($4, avatar) 
       WHERE id = $5 
       RETURNING id, email, name, role, avatar, is_verified, google_id, phone, address, created_at`,
      [name.trim(), phone ? phone.trim() : null, address ? address.trim() : null, avatar || null, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Lỗi cập nhật hồ sơ" });
  }
});

// Resend OTP
router.post("/resend-otp", authMiddleware, async (req, res) => {
  try {
    const { type } = req.body;
    const otp = generateOTP();
    await pool.query(
      "INSERT INTO otp_codes (user_id, code, type, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')",
      [req.user.id, otp, type || "EMAIL_VERIFY"]
    );
    await sendOTPEmail(req.user.email, otp, type || "EMAIL_VERIFY");
    res.json({ message: "Đã gửi lại mã OTP" });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
