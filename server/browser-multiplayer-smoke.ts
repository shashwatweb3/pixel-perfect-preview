import { chromium, type Browser } from "@playwright/test";

const appUrl = process.env["OFFSTAGE_APP_URL"] ?? "http://127.0.0.1:4173/world";

async function waitFor(check: () => Promise<boolean>, message: string, timeout = 12_000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(message);
}

async function openSession(browser: Browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.locator("canvas").waitFor();
  return page;
}

let browserA: Browser | undefined;
let browserB: Browser | undefined;

try {
  // Separate Chromium processes ensure each player has an independent browser session.
  const launchOptions = {
    headless: true,
    args: ["--enable-webgl", "--ignore-gpu-blocklist", "--use-angle=swiftshader-webgl"],
  };
  browserA = await chromium.launch(launchOptions);
  browserB = await chromium.launch(launchOptions);
  const [pageA, pageB] = await Promise.all([openSession(browserA), openSession(browserB)]);

  await waitFor(
    async () =>
      (await pageA.getByTestId("connection-status").textContent())?.includes("2 builders online") ??
      false,
    "First browser did not show two connected builders.",
  );
  await waitFor(
    async () =>
      (await pageB.getByTestId("connection-status").textContent())?.includes("2 builders online") ??
      false,
    "Second browser did not show two connected builders.",
  );

  const remoteOnB = pageB.locator('[data-testid^="remote-player-"]');
  await remoteOnB.first().waitFor();
  const before = await remoteOnB.first().boundingBox();
  if (!before) throw new Error("Remote builder label is not visible in the second browser.");

  await pageA.locator("canvas").click();
  await pageA.keyboard.down("KeyW");
  await pageA.waitForTimeout(900);
  await pageA.keyboard.up("KeyW");
  await pageB.waitForTimeout(500);

  const after = await remoteOnB.first().boundingBox();
  if (!after || Math.hypot(after.x - before.x, after.y - before.y) < 2) {
    throw new Error("Remote builder did not visibly move in the second browser.");
  }

  await pageA.close();
  await waitFor(
    async () =>
      (await pageB.getByTestId("connection-status").textContent())?.includes("1 builder online") ??
      false,
    "Leave synchronization did not update the remaining browser.",
  );
  console.log(
    "Browser multiplayer smoke passed: two sessions saw presence, movement, and leave sync.",
  );
} finally {
  await browserA?.close();
  await browserB?.close();
}
