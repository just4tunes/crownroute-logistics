import nextEnv from "@next/env";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const [name, suppliedEmail, suppliedRole] =
  process.argv.slice(2);

const password = process.env.CROWNROUTE_ADMIN_PASSWORD;
const mongoUri = process.env.MONGODB_URI;

const validRoles = ["owner", "developer", "staff"];

if (!name || !suppliedEmail || !suppliedRole) {
  console.error(
    'Usage: node scripts/create-admin.mjs "Name" "email@example.com" "owner"',
  );

  process.exit(1);
}

if (!validRoles.includes(suppliedRole)) {
  console.error(
    "Role must be owner, developer or staff.",
  );

  process.exit(1);
}

if (!password || password.length < 8) {
  console.error(
    "A password of at least eight characters is required.",
  );

  process.exit(1);
}

if (!mongoUri) {
  console.error(
    "MONGODB_URI is missing from .env.local.",
  );

  process.exit(1);
}

const email = suppliedEmail.trim().toLowerCase();

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: validRoles,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: Date,
  },
  {
    timestamps: true,
  },
);

const Admin =
  mongoose.models.Admin ||
  mongoose.model("Admin", adminSchema);

try {
  await mongoose.connect(mongoUri);

  const existingAdmin = await Admin.findOne({
    email,
  });

  if (existingAdmin) {
    console.error(
      `An administrator with ${email} already exists.`,
    );

    process.exitCode = 1;
  } else {
    const passwordHash = await bcrypt.hash(password, 12);

    await Admin.create({
      name,
      email,
      passwordHash,
      role: suppliedRole,
      isActive: true,
    });

    console.log(
      `${suppliedRole} administrator created successfully: ${email}`,
    );
  }
} catch (error) {
  console.error("Unable to create administrator:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}