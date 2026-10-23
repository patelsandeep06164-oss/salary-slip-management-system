require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("USER COUNT:", await User.countDocuments());

    const roles = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    console.log("ROLE COUNTS:", roles);
  } catch (error) {
    console.error("ERROR:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
