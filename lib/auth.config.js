// Edge-safe auth config (no Node.js-only imports like bcryptjs or Prisma)
export const authConfig = {
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.userId = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.userId) session.user.id = token.userId;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [], // Populated in lib/auth.js with Credentials provider
};
