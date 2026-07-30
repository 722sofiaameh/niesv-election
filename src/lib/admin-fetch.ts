type JsonRecord = Record<string, unknown>;

export type AdminFetchResult<T> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
};

export async function adminFetch<T extends JsonRecord>(
  url: string,
  init?: RequestInit,
): Promise<AdminFetchResult<T>> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch {
    return {
      ok: false,
      status: 0,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  if (response.status === 401 && typeof window !== "undefined") {
    const callbackUrl = encodeURIComponent(window.location.pathname);
    window.location.href = `/admin/login?callbackUrl=${callbackUrl}`;
    return {
      ok: false,
      status: 401,
      error: "Your admin session has expired. Please sign in again.",
    };
  }

  const text = await response.text();
  if (!text) {
    return {
      ok: false,
      status: response.status,
      error:
        response.status >= 500
          ? "The server returned an empty response. Try again in a moment."
          : "The server returned an empty response.",
    };
  }

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    return {
      ok: false,
      status: response.status,
      error: "Unexpected server response. Try refreshing the page.",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error:
        typeof data.error === "string"
          ? data.error
          : "Something went wrong. Please try again.",
    };
  }

  return { ok: true, status: response.status, data };
}
