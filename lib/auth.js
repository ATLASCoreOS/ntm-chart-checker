import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./db";
import { authConfig } from "./auth.config";
import { rateLimit } from "./rateLimit";

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Match the normalization applied at registration
        const email = String(credentials.email).trim().toLowerCase();

        // Throttle brute-force: cap login attempts per email per 15 min
        const limit = await rateLimit({
          key: `login:${email}`,
          limit: 10,
          windowSec: 900,
        });
        if (!limit.ok) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
