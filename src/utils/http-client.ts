import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios";
import type { Logger } from "./logger";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

let uaIndex = 0;

function nextUserAgent(): string {
  const ua = USER_AGENTS[uaIndex % USER_AGENTS.length];
  uaIndex += 1;
  return ua;
}

export interface HttpClientOptions {
  slow?: boolean;
  timeoutMs?: number;
  maxRetries?: number;
  logger?: Logger;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const BACKOFF_BASE_MS = [2000, 4000, 8000];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Axios instance with Swedish Accept-Language; use `requestWithBackoff` for retries. */
export function createHttpClient(options: HttpClientOptions = {}): AxiosInstance {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const instance = axios.create({
    timeout: timeoutMs,
    validateStatus: () => true,
    headers: {
      "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
    },
  });

  instance.interceptors.request.use((config) => {
    config.headers = config.headers ?? {};
    config.headers["User-Agent"] = nextUserAgent();
    return config;
  });

  return instance;
}

export async function requestWithBackoff<T = unknown>(
  instance: AxiosInstance,
  req: AxiosRequestConfig,
  options: HttpClientOptions = {},
): Promise<AxiosResponse<T>> {
  const maxRetries = options.maxRetries ?? 3;
  const slowMult = options.slow ? 2 : 1;
  const log = options.logger;
  let attempt = 0;
  let lastErr: unknown;
  while (attempt < maxRetries) {
    try {
      return await instance.request<T>(req);
    } catch (err) {
      lastErr = err;
      attempt += 1;
      if (attempt >= maxRetries) break;
      const backoff = (BACKOFF_BASE_MS[attempt - 1] ?? 8000) * slowMult;
      log?.debug(`HTTP retry ${attempt}/${maxRetries} after ${backoff}ms`, {
        url: req.url,
      });
      await sleep(backoff);
    }
  }
  throw lastErr;
}
