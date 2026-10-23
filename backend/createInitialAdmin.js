require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  try {
    const email = (await ask("New admin email: ")).trim().toLowerCase();
    const name = (await ask("Admin name: ")).trim();
    const password = await ask("Create a strong password (minimum 12 characters): ");

    if (!email || !name || password.length < 12) {
      throw new Error("Email/name required; password must be at least 12 characters.");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const existing = await User.findOne({ email });

    if (existing) {
      throw new Error("This email already has an account. No changes made.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      email,
      password: passwordHash,
      role: "admin",
      isActive: true
    });

    console.log("INITIAL ADMIN CREATED.");
    console.log("Role:", admin.role);
    console.log("Account ID:", admin._id.toString());
    console.log("Password was stored as a hash.");
  } catch (error) {
    console.error("SETUP FAILED:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect().catch(() => {});
  }
}

main();
