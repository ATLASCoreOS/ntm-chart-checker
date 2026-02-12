import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { DEFAULT_CHARTS } from "@/lib/charts";
import { BCRYPT_ROUNDS } from "@/lib/constants";

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    // Validate
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check existing
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user + default folio in transaction
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name ? name.slice(0, 100).trim() : null,
        folio: {
          create: {
            charts: DEFAULT_CHARTS,
          },
        },
      },
    });

    return NextResponse.json({ message: "Account created" }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
