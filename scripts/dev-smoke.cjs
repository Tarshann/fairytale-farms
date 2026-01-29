/* eslint-disable no-console */
const http = require("http");

function check(url) {
  return new Promise(resolve => {
    const req = http.get(url, res => {
      res.resume();
      resolve({ ok: res.statusCode === 200, status: res.statusCode, url });
    });
    req.on("error", err => resolve({ ok: false, error: err.message, url }));
    req.setTimeout(2500, () => {
      req.destroy(new Error("timeout"));
    });
  });
}

(async () => {
  if (process.env.SMOKE_URL) {
    const result = await check(process.env.SMOKE_URL);
    if (result.ok) {
      console.log("SMOKE_OK", result.status, result.url);
      process.exit(0);
    }
    console.error(
      "SMOKE_FAIL",
      result.status || "",
      result.url,
      result.error || ""
    );
    process.exit(1);
  }

  const startPort = Number.parseInt(process.env.PORT || "3000", 10);
  const maxPorts = 20;

  for (let i = 0; i < maxPorts; i++) {
    const port = startPort + i;
    const url = `http://localhost:${port}/health`;
    const result = await check(url);

    if (result.ok) {
      console.log("SMOKE_OK", result.status, result.url);
      process.exit(0);
    }
  }

  console.error(
    `SMOKE_FAIL: no healthy /health endpoint found on ports ${startPort}-${
      startPort + maxPorts - 1
    }`
  );
  process.exit(1);
})();
