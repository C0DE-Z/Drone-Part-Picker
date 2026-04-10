export interface FetchOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  retryBackoffMs?: number;
}

export interface HtmlResponse {
  url: string;
  html: string;
  status: number;
}

const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_RETRIES = 3;
const DEFAULT_BACKOFF_MS = 600;

export const delay = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

export const buildAbsoluteUrl = (input: string, baseUrl: string): string => {
  try {
    return new URL(input, baseUrl).toString();
  } catch {
    return input;
  }
};

export async function fetchHtmlWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<HtmlResponse> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const retryBackoffMs = options.retryBackoffMs ?? DEFAULT_BACKOFF_MS;

  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: options.headers,
        signal: AbortSignal.timeout(timeoutMs)
      });

      const html = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return {
        url,
        html,
        status: response.status
      };
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await delay(retryBackoffMs * attempt);
      }
    }
  }

  throw new Error(`Failed to fetch ${url}: ${(lastError as Error)?.message || 'unknown error'}`);
}
