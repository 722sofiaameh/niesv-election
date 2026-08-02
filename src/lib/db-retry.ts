const RETRYABLE_CODES = new Set(["P1001", "P1002", "P1017", "P2024"]);

function isRetryableDbError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    RETRYABLE_CODES.has((error as { code: string }).code)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry transient Neon/Postgres connection errors (cold start, pool timeout). */
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  options: { attempts?: number; delayMs?: number } = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const delayMs = options.delayMs ?? 2000;

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableDbError(error) || attempt === attempts) {
        throw error;
      }
      console.warn(
        `Database connection attempt ${attempt}/${attempts} failed, retrying…`,
      );
      await sleep(delayMs * attempt);
    }
  }

  throw lastError;
}
