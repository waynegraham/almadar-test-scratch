"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ENVIRONMENT_COOKIE } from "@/server/environment";

export async function switchEnvironment(formData: FormData) {
  const environment = formData.get("environment");
  if (environment !== "staging" && environment !== "production" && environment !== "configured") {
    throw new Error("Unknown environment");
  }
  (await cookies()).set(ENVIRONMENT_COOKIE, environment, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}
