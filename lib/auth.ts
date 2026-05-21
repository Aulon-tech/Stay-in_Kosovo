import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { parseJson, UserPreferences } from "@/lib/utils";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        const prefs = parseJson<UserPreferences>(user.preferences, {
          vibes: [],
          interests: [],
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          preferences: prefs,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "USER";
        token.preferences =
          (user as { preferences?: UserPreferences }).preferences || {
            vibes: [],
            interests: [],
          };
      }
      if (token.id && (!token.preferences || trigger === "update")) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
        });
        if (dbUser?.preferences) {
          token.preferences = parseJson<UserPreferences>(dbUser.preferences, {
            vibes: [],
            interests: [],
          });
        }
      }
      if (trigger === "update" && session?.preferences) {
        token.preferences = session.preferences;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { preferences?: UserPreferences }).preferences =
          token.preferences as UserPreferences;
      }
      return session;
    },
  },
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}
