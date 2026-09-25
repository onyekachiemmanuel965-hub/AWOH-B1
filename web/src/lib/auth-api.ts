import { getApiBase } from "./api";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
};

async function authFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; status: number }> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }

  if (!res.ok) {
    const message =
      typeof body === "object" &&
      body &&
      "message" in body &&
      (body as { message: unknown }).message
        ? Array.isArray((body as { message: unknown }).message)
          ? ((body as { message: string[] }).message).join(", ")
          : String((body as { message: unknown }).message)
        : "Request failed.";
    throw Object.assign(new Error(message), { status: res.status });
  }

  return { data: body as T, status: res.status };
}

export async function registerAccount(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const { data } = await authFetch<{ user: AuthUser }>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function loginAccount(input: { email: string; password: string }) {
  const { data } = await authFetch<{ user: AuthUser }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data } = await authFetch<{ user: AuthUser }>("/api/v1/auth/me", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    return data.user;
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 401) {
      // Try one refresh
      try {
        await authFetch("/api/v1/auth/refresh", { method: "POST", body: "{}" });
        const { data } = await authFetch<{ user: AuthUser }>("/api/v1/auth/me");
        return data.user;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function logoutAccount() {
  await authFetch("/api/v1/auth/logout", { method: "POST", body: "{}" });
}
