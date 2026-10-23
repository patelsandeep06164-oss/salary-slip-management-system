
const User = require("../models/User");

const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email role phone address profilePhoto isActive lastLogin passwordChangedAt createdAt updatedAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const { name, email, phone, address, profilePhoto } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid name.",
        });
      }

      if (name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: "Name cannot exceed 100 characters.",
        });
      }

      user.name = name.trim();
    }

    if (email !== undefined) {
      if (
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address.",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      }).select("_id");

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "This email address is already registered.",
        });
      }

      user.email = normalizedEmail;
    }

    if (phone !== undefined) {
      if (typeof phone !== "string" || phone.trim().length > 20) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid phone number.",
        });
      }

      user.phone = phone.trim();
    }

    if (address !== undefined) {
      if (typeof address !== "string" || address.trim().length > 300) {
        return res.status(400).json({
          success: false,
          message: "Address cannot exceed 300 characters.",
        });
      }

      user.address = address.trim();
    }

    if (profilePhoto !== undefined) {
      if (typeof profilePhoto !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid profile photo.",
        });
      }

      if (profilePhoto && !/^data:image\/(jpeg|jpg|png|webp);base64,/.test(profilePhoto)) {
        return res.status(400).json({
          success: false,
          message: "Please upload a valid image.",
        });
      }

      if (profilePhoto.length > 700000) {
        return res.status(413).json({
          success: false,
          message: "Profile photo is too large. Please choose a smaller image.",
        });
      }

      user.profilePhoto = profilePhoto;
    }

    await user.save();

    const safeUser = await User.findById(user._id).select(
      "name email role phone address profilePhoto isActive lastLogin passwordChangedAt createdAt updatedAt"
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: safeUser,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered.",
      });
    }

    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
};
