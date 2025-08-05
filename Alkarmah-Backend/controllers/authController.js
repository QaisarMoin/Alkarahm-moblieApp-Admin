import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import otpGenerator from 'otp-generator';
import admin from "firebase-admin";
import { sendOtpEmail } from "../Config/emailService.js";

const otpStore = {}
dotenv.config();

// OTP via email (in-memory for demo)
export const resendOtpByEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  // Generate 6-digit OTP
  const otp = Math.floor(10000 + Math.random() * 90000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min
  otpStore[email] = { otp, expiresAt };

  try {
    await sendOtpEmail(email, otp);
    res.status(200).json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP', error });
  }
};

export const sendOtpByEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });


  // Generate 6-digit OTP
  const otp = Math.floor(10000 + Math.random() * 90000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min
  otpStore[email] = { otp, expiresAt, attempts: 0 }; // Reset attempts on new OTP

  try {
    await sendOtpEmail(email, otp);
    res.status(200).json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP', error });
  }
};

export const verifyOtpByEmail = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  const record = otpStore[email];
  if (!record) return res.status(400).json({ success: false, message: 'No OTP sent to this email' });

  record.attempts = (record.attempts || 0) + 1;
  if (record.attempts > 5) {
    delete otpStore[email];
    return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
  }
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }
  if (record.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
  delete otpStore[email];
  try{
    // Check for existing user
    let user = await User.findOne({ 'email': email }).populate("managedShops", "name status");

    // If not, create a new user
    if (!user) {
      user = new User({
        email,
        createdAt: new Date()
      });
      try {
  await user.save();
  
} catch (saveErr) {
  console.error("❌ Error saving user:", saveErr);
  return res.status(500).json({
    success: false,
    message: "Failed to create user",
    error: saveErr.message
  });
}
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated"
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET ?? "SECRET_KEY",
      { expiresIn: "24h" }
    );

    const userResponse = {
      _id: user._id,
      email: user.email,
      role: user.role,
      managedShops: user.managedShops,
      createdAt: user.createdAt
    };

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: userResponse,
        token,
        expiresIn: "24h"
      }
    });

  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, role = "customer" ,phone } = req.body;

    // Validate role
    const validRoles = ["customer", "shop_admin", "super_admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid role specified" 
      });
    }

    // Only super admins can create other super admins
    if (role === "super_admin" && (!req.user || req.user.role !== "super_admin")) {
      return res.status(403).json({ 
        success: false,
        message: "Only super admins can create super admin accounts" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ 
      name, 
      email, 
      password: hashed, 
      role: role,
      profile: { phone }, 
    });
    await user.save();

    return res.status(201).json({ 
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        name: user.name,

        email: user.email,
        role: user.role,
        profile: user.profile,
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("managedShops", "name status");
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role,
        email: user.email 
      }, 
      process.env.JWT_SECRET ?? "SECRET", 
      { expiresIn: "24h" }
    );

    // Remove password from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      managedShops: user.managedShops,
      profile: user.profile,
      createdAt: user.createdAt
    };

    return res.status(200).json({ 
      success: true,
      message: "Login successful", 
      data: {
        user: userResponse,
        token,
        expiresIn: "24h"
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: "Old password incorrect" 
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({ 
      success: true,
      message: "Password updated successfully" 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email, phone, dateOfBirth } = req.body;

    // Find the current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already exists"
        });
      }
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
      }
    }

    // Validate phone format if provided (basic validation)
    if (phone) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format"
        });
      }
    }

    // Validate date of birth if provided
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      
      if (isNaN(dob.getTime()) || dob > today || age > 120) {
        return res.status(400).json({
          success: false,
          message: "Invalid date of birth"
        });
      }
    }

    // Update user fields
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    
    // Update profile fields
    if (phone !== undefined || dateOfBirth !== undefined) {
      updateData.profile = { ...user.profile };
      if (phone !== undefined) updateData.profile.phone = phone;
      if (dateOfBirth !== undefined) updateData.profile.dateOfBirth = new Date(dateOfBirth);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate("managedShops", "name status");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          profile: updatedUser.profile,
          managedShops: updatedUser.managedShops,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt
        }
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};

export const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(
      user
   );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to find user", error });
  }
};

export const updateFCMtoken = async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;
    
    if (!userId || !fcmToken) {
      return res.status(400).json({ message: 'userId and fcmToken are required' });
    }

    await User.findByIdAndUpdate(userId, { fcmToken });
 
    return res.status(200).json({ message: 'FCM token updated successfully' });
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const sendotp = async (req, res) => {

  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required' });

  // Generate only numeric 6-digit OTP
  const otp = Math.floor(10000 + Math.random() * 90000).toString();

  otpStore[phone] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // valid for 5 minutes
  };

  console.log(`OTP for ${phone} is ${otp}`);
  res.status(200).json({ message: 'OTP sent successfully' ,'opt':otp});
};
export const verifyotps = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp)
    return res.status(400).json({ success: false, message: 'Phone and OTP are required' });

  const record = otpStore[phone];
  if (!record)
    return res.status(400).json({ success: false, message: 'OTP not found' });

  if (Date.now() > record.expiresAt) {
    delete otpStore[phone];
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }

  if (record.otp !== otp)
    return res.status(400).json({ success: false, message: 'Invalid OTP' });

  delete otpStore[phone];
  res.status(200).json({ message: 'OTP verified successfully' });
};


export const verifyotp = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp)
    return res.status(400).json({ success: false, message: 'Phone and OTP are required' });

  const record = otpStore[phone];
  if (!record)
    return res.status(400).json({ success: false, message: 'OTP not found' });

  if (Date.now() > record.expiresAt) {
    delete otpStore[phone];
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }

  if (record.otp !== otp)
    return res.status(400).json({ success: false, message: 'Invalid OTP' });

  delete otpStore[phone];

  try {
    // Check for existing user
    let user = await User.findOne({ 'profile.phone': phone }).populate("managedShops", "name status");

    // If not, create a new user
    if (!user) {
      user = new User({
        role: 'customer',
        email:`changeyoumail${phone}@example.com`,
        profile: { phone },
        createdAt: new Date()
      });
      try {
  await user.save();
  
} catch (saveErr) {
  console.error("❌ Error saving user:", saveErr);
  return res.status(500).json({
    success: false,
    message: "Failed to create user",
    error: saveErr.message
  });
}
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated"
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        phone: user.profile.phone
      },
      process.env.JWT_SECRET ?? "SECRET_KEY",
      { expiresIn: "24h" }
    );

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      managedShops: user.managedShops,
      profile: user.profile,
      createdAt: user.createdAt
    };

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: userResponse,
        token,
        expiresIn: "24h"
      }
    });

  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

export const verifyotpTesting = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp)
    return res.status(400).json({ success: false, message: 'Phone and OTP are required' });

  const record = otpStore[phone];
  if (!record && otp !== '88888') {
    return res.status(400).json({ success: false, message: 'OTP not found' });
  }

  const TEST_OTP = '88888';
  const isTestOtp = otp === TEST_OTP;

  if (!isTestOtp && Date.now() > record.expiresAt) {
    delete otpStore[phone];
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }

  if (!isTestOtp && record.otp !== otp)
    return res.status(400).json({ success: false, message: 'Invalid OTP' });

  delete otpStore[phone];

  try {
    // Check for existing user
    let user = await User.findOne({ 'profile.phone': phone }).populate("managedShops", "name status");

    // If not, create a new user
    if (!user) {
      user = new User({
        role: 'customer',
        email:`changeyoumail${phone}@example.com`,
        profile: { phone },
        createdAt: new Date()
      });
      try {
        await user.save();
      } catch (saveErr) {
        console.error("❌ Error saving user:", saveErr);
        return res.status(500).json({
          success: false,
          message: "Failed to create user",
          error: saveErr.message
        });
      }
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated"
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        phone: user.profile.phone
      },
      process.env.JWT_SECRET ?? "SECRET_KEY",
      { expiresIn: "24h" }
    );

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      managedShops: user.managedShops,
      profile: user.profile,
      createdAt: user.createdAt
    };

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: userResponse,
        token,
        expiresIn: "24h"
      }
    });

  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

export const sendNotification = async (req,res) =>{
  const { userId, title, body } = req.body;


  if (!userId || !title || !body)
    return res.status(400).json({ message: "Missing parameters" });

  try {
    const user = await User.findById(userId);
    if (!user?.fcmToken) {
      return res.status(404).json({ message: "User or FCM token not found" });
    }

    const message = {
      notification: {
        title,
        body,
      },
      token: user.fcmToken,
    };
   
    await admin.messaging().send(message);
    res.status(200).json({ message: "Notification sent successfully" });
  } catch (error) {
    console.error("Notification error:", error);
    res.status(500).json({ message: "Notification failed", error });
  }
};

export const googleAuth = async (req, res) => {
  const { idToken, user: googleUser } = req.body.data || req.body;

  if (!idToken || !googleUser) {
    return res.status(400).json({ success: false, message: "Missing idToken or user info" });
  }

  const { email, name, photo } = googleUser;

  try {
    // Step 1: Find existing user by email
    let user = await User.findOne({ email });

    // Step 2: If user doesn't exist, create a new one
    if (!user) {
      user = await User.create({
        name,
        email,
        profile: {
          avatar: photo,
        },
        password: "", // Password is not required for Google-authenticated users
        role: "customer",
      });
    } else {
      // Optional: Update profile info
      user.name = name || user.name;
      user.profile.avatar = photo || user.profile.avatar;
      await user.save();
    }

    // Step 3: Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // Step 4: Generate JWT Token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "24h" }
    );

    // Step 5: Format response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      managedShops: user.managedShops,
      profile: user.profile,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      data: {
        user: userResponse,
        token,
        expiresIn: "24h",
      },    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({
      success: false,
      message: "Google login failed",
      error: error.message,
    });
  }
};

export const appleAuth = async (req, res) => {
  const { identityToken } = req.body;

  if (!identityToken) {
    return res.status(400).json({ success: false, message: "Missing identityToken" });
  }
  // Decode the identity token to extract user info
  let appleUser;
  try {
    appleUser = jwt.decode(identityToken);
    if (!appleUser || !appleUser.email) {
      return res.status(400).json({ success: false, message: "Invalid Apple identity token" });
    }
  } catch (error) {
    console.error("Error decoding Apple identity token:", error);
    return res.status(400).json({ success: false, message: "Invalid Apple identity token" });
  }
  const { email } = appleUser;
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required from Apple identity token" });
  }

  try {
    // 2. Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: appleUser.name || "Apple User",
        email,
        password: "", // No password for Apple-auth users
        role: "customer",
      });
    } else {
      user.name = appleUser.name || user.name;
      await user.save();
    }

    // 3. Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated"
      });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "SECRET",
      { expiresIn: "24h" }
    );

    // 5. Prepare user response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      managedShops: user.managedShops,
      profile: user.profile,
      createdAt: user.createdAt
    };

    return res.status(200).json({
      success: true,
      message: "Apple login successful",
      data: {
        user: userResponse,
        token,
        expiresIn: "24h"
      }
    });
  } catch (error) {
    console.error("Apple login error:", error);
    return res.status(500).json({
      success: false,
      message: "Apple login failed",
      error: error.message,
    });
  }
}

export const sendEmail = async (req, res) => {
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  try {
    const mailOptions = {
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ success: false, message: "Email sending failed", error });
  }
};

// Forgot Password: Request OTP
export const forgotPasswordRequest = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: 'No such user found' });
  // Generate OTP for password reset
  const otp = Math.floor(10000 + Math.random() * 90000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min
  otpStore['fp_' + email] = { otp, expiresAt, attempts: 0 };
  try {
    await sendOtpEmail(email, otp);
    res.status(200).json({ success: true, message: 'OTP sent to email for password reset' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP', error });
  }
};

// Forgot Password: Verify OTP
export const forgotPasswordVerifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  const key = 'fp_' + email;
  const record = otpStore[key];
  if (!record) return res.status(400).json({ success: false, message: 'No OTP sent to this email' });
  if (Date.now() > record.expiresAt) {
    delete otpStore[key];
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }
  if (record.otp === otp) {
    record.verified = true; // Mark as verified for reset
    return res.status(200).json({ success: true, message: 'OTP verified for password reset' });
  } else {
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts > 5) {
      delete otpStore[key];
      return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
    }
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
};

// Forgot Password: Reset Password
export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ success: false, message: 'Email and new password are required' });
  const key = 'fp_' + email;
  const record = otpStore[key];
  if (!record || !record.verified) return res.status(400).json({ success: false, message: 'OTP not verified for this email' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No such user found' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    delete otpStore[key];
    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset password', error });
  }
};

export const sendOtpByEmailAdmin = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(10000 + Math.random() * 90000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min
  otpStore[email] = { otp, expiresAt, attempts: 0 }; // Reset attempts on new OTP

  try {
    await sendOtpEmail(email, otp);
    res.status(200).json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP', error });
  }
};


export const verifyOtpByEmailAdmin = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  const record = otpStore[email];
  if (!record) return res.status(400).json({ success: false, message: 'No OTP sent to this email' });

  record.attempts = (record.attempts || 0) + 1;
  if (record.attempts > 5) {
    delete otpStore[email];
    return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
  }
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }
  if (record.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
  delete otpStore[email];
  try{
    // Check for existing user
    let user = await User.findOne({ 'email': email }).populate("managedShops", "name status");

    // If not, create a new user
    if (!user) {
      user = new User({
        email,
        createdAt: new Date()
      });
      try {
  await user.save();
  
} catch (saveErr) {
  console.error("❌ Error saving user:", saveErr);
  return res.status(500).json({
    success: false,
    message: "Failed to create user",
    error: saveErr.message
  });
}
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated"
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET ?? "SECRET_KEY",
      { expiresIn: "24h" }
    );

    const userResponse = {
      _id: user._id,
      email: user.email,
      role: user.role,
      managedShops: user.managedShops,
      createdAt: user.createdAt
    };

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: userResponse,
        token,
        expiresIn: "24h"
      }
    });

  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};