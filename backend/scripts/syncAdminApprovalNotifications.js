
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");

async function syncNotifications() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const pendingOrProcessedAdmins = await User.find({
      role: "admin",
      adminApprovalStatus: { $in: ["approved", "rejected"] },
    }).select("_id name email adminApprovalStatus");

    for (const admin of pendingOrProcessedAdmins) {
      const approved = admin.adminApprovalStatus === "approved";

      const result = await Notification.updateMany(
        {
          category: "admin-approval",
          "metadata.adminId": admin._id,
        },
        {
          $set: {
            title: approved
              ? "Admin Registration Approved"
              : "Admin Registration Rejected",
            message: approved
              ? `${admin.name} (${admin.email})'s Admin registration has been approved.`
              : `${admin.name} (${admin.email})'s Admin registration has been rejected.`,
            type: approved ? "success" : "error",
            "metadata.status": admin.adminApprovalStatus,
            isRead: true,
            readAt: new Date(),
          },
        }
      );

      console.log(
        admin.email,
        admin.adminApprovalStatus,
        "Updated:",
        result.modifiedCount
      );
    }
  } catch (error) {
    console.error("Sync failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

syncNotifications();
