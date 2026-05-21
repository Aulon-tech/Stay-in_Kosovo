import { DefaultSession } from "next-auth";
import { UserPreferences } from "@/lib/utils";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      preferences: UserPreferences;
    };
  }

  interface User {
    id: string;
    role: string;
    preferences: UserPreferences;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    preferences: UserPreferences;
  }
}
