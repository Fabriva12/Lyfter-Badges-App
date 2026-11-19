import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: ["ATTENDEE", "ADMIN", "SUPER_ADMIN"],
        required: true,
        defaultValue: "ATTENDEE",
        input: false,
      },
    },
  },
  // nextCookies() must stay last: it wires Server Action cookies.
  plugins: [nextCookies()],
});
