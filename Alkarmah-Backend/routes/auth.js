import { Router } from "express";

import { signup, login, changePassword, updateProfile, updateFCMtoken, sendotp, verifyotp ,getAllUsers,getSingleUser, verifyotpTesting, sendNotification, googleAuth, appleAuth, sendOtpByEmail, verifyOtpByEmail, sendEmail,resendOtpByEmail, forgotPasswordRequest, forgotPasswordVerifyOtp, resetPassword,  sendOtpByEmailAdmin, verifyOtpByEmailAdmin } from "../controllers/authController.js";

import { verifyToken } from "../middleware/auth.js";
import deleteOwnAccount from "../controllers/deleteOwnAccount.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/alluser",getAllUsers)
router.get("/user/:id", getSingleUser);
router.post("/change-password", changePassword);
router.put("/profile", verifyToken, updateProfile);
router.put("/update-fcm-token",verifyToken,updateFCMtoken);
router.post("/send-otp-email-admin", sendOtpByEmailAdmin);
router.post("/verify-otp-email-admin", verifyOtpByEmailAdmin);

// Email OTP endpoints
router.post("/send-otp-email", sendOtpByEmail);
router.post("/verify-otp-email", verifyOtpByEmail);
router.post("/sendNotification",sendNotification);
router.post("/google-signin",googleAuth);
router.post("/apple",appleAuth);
router.post("/send-email", sendEmail);
router.post("/resend-otp-email", resendOtpByEmail);

router.delete("/me", verifyToken, deleteOwnAccount);


// Forgot Password endpoints
router.post("/forgot-password-request", forgotPasswordRequest);
router.post("/forgot-password-verify-otp", forgotPasswordVerifyOtp);
router.post("/reset-password", resetPassword);


export default router;