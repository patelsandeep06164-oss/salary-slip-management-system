require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const pendingAdmins = await User.find({
      role: "admin",
      adminApprovalStatus: "pending",
      isActive: false,
    }).select("_id name email").lean();

    const existingAdmins = await User.find({
      role: "admin",
      isActive: true,
      $or: [
        { adminApprovalStatus: "approved" },
        { adminApprovalStatus: null },
      ],
    }).select("_id").lean();

    if (!pendingAdmins.length || !existingAdmins.length) {
      console.log("Pending Admins:", pendingAdmins.length);
      console.log("Existing Admin recipients:", existingAdmins.length);
      return;
    }

    const operations = [];

    for (const pending of pendingAdmins) {
      for (const recipient of existingAdmins) {
        const key = `admin-registration:${pending._id}:${recipient._id}`;

        operations.push({
          updateOne: {
            filter: { dedupeKey: key },
            update: {
              $setOnInsert: {
                recipientAdmin: recipient._id,
                title: "New Admin Registration Pending",
                message: `${pending.name} (${pending.email}) has requested Admin access. Please review this registration.`,
                type: "warning",
                category: "admin-approval",
                metadata: {
                  adminId: pending._id,
                  adminName: pending.name,
                  adminEmail: pending.email,
                  status: "pending",
                },
                dedupeKey: key,
                isRead: false,
              },
            },
            upsert: true,
          },
        });
      }
    }

    const result = await Notification.bulkWrite(operations, { ordered: false });

    console.log("Notification backfill completed.");
    console.log("New notifications:", result.upsertedCount);
    console.log("Already existing:", result.matchedCount);
  } catch (error) {
    console.error("Backfill failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
