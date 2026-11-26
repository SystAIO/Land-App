import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
export const API_ENABLED = API_BASE.length > 0;

const TOKEN_KEY = "systio.api.token";

export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string | null) {
  if (!token) {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return;
  }
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
};

/** JSON fetch wrapper for the SystIO backend. Throws Error with the backend's message. */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  if (!API_ENABLED) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL is not set. Point the app at your backend (e.g. http://10.0.2.2:3000)."
    );
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  if (options.auth !== false) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? "GET",
      headers,
      body,
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(`Server returned an invalid response (HTTP ${response.status}).`);
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }
  return payload as T;
}
