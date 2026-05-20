import { auth } from "@/lib/firebase";

/**
 * Wrapper around fetch() that automatically attaches the Firebase ID token
 * as an Authorization: Bearer header. Use this for all /api/ calls.
 */
export async function authFetch(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Not authenticated");
  }

  const token = await user.getIdToken();

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, { ...init, headers });
}
