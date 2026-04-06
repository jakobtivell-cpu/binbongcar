import { createHttpClient, requestWithBackoff } from "../src/utils/http-client";

describe("http-client", () => {
  it("creates axios instance with timeout and Accept-Language", () => {
    const client = createHttpClient({ timeoutMs: 9999 });
    expect(client.defaults.timeout).toBe(9999);
    const headers = client.defaults.headers;
    const common = (headers as { common?: Record<string, string> }).common;
    const lang =
      common?.["Accept-Language"] ??
      (headers as Record<string, string>)["Accept-Language"];
    expect(String(lang)).toContain("sv-SE");
  });

  it("requestWithBackoff retries then throws on unreachable host", async () => {
    const client = createHttpClient({ maxRetries: 2, timeoutMs: 500 });
    await expect(
      requestWithBackoff(
        client,
        {
          method: "GET",
          url: "http://127.0.0.1:1/",
          timeout: 300,
        },
        { maxRetries: 2 },
      ),
    ).rejects.toThrow();
  }, 15000);
});
