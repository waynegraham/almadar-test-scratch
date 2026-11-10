import { cookies } from "next/headers";
import { getEnvironmentConfig, resolveEnvironment } from "../lib/config";

export const ENVIRONMENT_COOKIE = "almadar-environment";

export async function getRequestEnvironment() {
  const value = (await cookies()).get(ENVIRONMENT_COOKIE)?.value;
  const environment = resolveEnvironment(value);
  return { environment, config: getEnvironmentConfig(environment) };
}
