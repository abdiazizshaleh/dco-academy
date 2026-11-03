import { test, expect, type BrowserContext } from "@playwright/test";
import { initial, makeStory } from "../src/store";
const userId = "11111111-1111-4111-8111-111111111111";
const user = {
  id: userId,
  aud: "authenticated",
  role: "authenticated",
  email: "learner@example.test",
  email_confirmed_at: new Date().toISOString(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
const jwt = [
  { alg: "HS256", typ: "JWT" },
  {
    sub: userId,
    aud: "authenticated",
    role: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  "test",
]
  .map((x) =>
    Buffer.from(typeof x === "string" ? x : JSON.stringify(x)).toString(
      "base64url",
    ),
  )
  .join(".");
const cloudStory = {
  ...makeStory(),
  title: "Story saved on another device",
  situation:
    "An outage affected several users. I checked the evidence before choosing a repair.",
};
test("account loading, autosave, conflict handling, offline cache, and guest isolation", async ({
  page,
  context,
}) => {
  let record = {
    user_id: userId,
    state: { ...initial, stories: [cloudStory] },
    revision: 1,
  };
  let offline = false;
  let writes = 0;
  await context.route("https://dco-test.supabase.co/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    };
    if (req.method() === "OPTIONS")
      return route.fulfill({ status: 204, headers: cors });
    if (url.pathname === "/auth/v1/token")
      return route.fulfill({
        json: {
          access_token: jwt,
          refresh_token: "test-refresh",
          token_type: "bearer",
          expires_in: 3600,
          user,
        },
        headers: cors,
      });
    if (url.pathname === "/auth/v1/user")
      return route.fulfill({ json: user, headers: cors });
    if (url.pathname === "/auth/v1/logout")
      return route.fulfill({ status: 204, headers: cors });
    if (url.pathname === "/rest/v1/learning_records") {
      if (offline)
        return route.fulfill({
          status: 503,
          json: { message: "Offline test" },
          headers: cors,
        });
      if (req.method() === "GET")
        return route.fulfill({ json: [record], headers: cors });
      if (req.method() === "PATCH") {
        const expected = Number(
          url.searchParams.get("revision")?.replace("eq.", ""),
        );
        if (expected !== record.revision)
          return route.fulfill({ json: [], headers: cors });
        record = { ...record, ...req.postDataJSON() };
        writes++;
        return route.fulfill({
          json: [{ revision: record.revision }],
          headers: cors,
        });
      }
    }
    return route.fulfill({
      status: 404,
      json: { message: "Unexpected endpoint" },
      headers: cors,
    });
  });
  await page.goto("/");
  await page
    .locator(".sidebar nav")
    .getByRole("button", { name: "STAR Story Vault", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create a story", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Story title", exact: true })
    .fill("Private guest draft");
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Account and sync" }).click();
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("learner@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("a-strong-test-password");
  await page
    .getByRole("button", { name: "Sign in", exact: true })
    .last()
    .click();
  await expect(
    page.getByText("learner@example.test", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close preferences" }).click();
  await expect(
    page.getByRole("textbox", { name: "Story title", exact: true }),
  ).toHaveValue(cloudStory.title);
  await expect(page.locator(".story-layout")).not.toContainText(
    "Private guest draft",
  );
  await page
    .getByRole("textbox", { name: "Result", exact: true })
    .fill("Verified service recovery and documented the approved change.");
  await expect.poll(() => writes).toBe(1);
  expect(record.state.stories[0].result).toContain("Verified service recovery");
  expect(record.revision).toBe(2);
  record = {
    ...record,
    revision: 3,
    state: {
      ...record.state,
      stories: [
        { ...record.state.stories[0], title: "Newer copy from device two" },
      ],
    },
  };
  await page
    .getByRole("textbox", { name: "Story title", exact: true })
    .fill("Conflicting local title");
  await expect(page.getByRole("alert")).toContainText(
    "Another device saved a newer copy",
  );
  await page.getByRole("button", { name: "Account and sync" }).click();
  await page
    .getByRole("button", { name: "Use the account copy", exact: true })
    .click();
  await page.getByRole("button", { name: "Close preferences" }).click();
  await expect(
    page.getByRole("textbox", { name: "Story title", exact: true }),
  ).toHaveValue("Newer copy from device two");
  offline = true;
  await page
    .getByRole("textbox", { name: "Story title", exact: true })
    .fill("Offline work is retained");
  await expect(page.getByRole("alert")).toContainText("account save failed");
  await page.reload();
  await page
    .locator(".sidebar nav")
    .getByRole("button", { name: "STAR Story Vault", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Story title", exact: true }),
  ).toHaveValue("Offline work is retained");
  offline = false;
  await page.getByRole("button", { name: "Account and sync" }).click();
  await page.getByRole("button", { name: "Reconnect", exact: true }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByText("Saved to your account", { exact: true }),
  ).toBeVisible();
  const resetSummary = page
    .locator("summary")
    .filter({ hasText: "Reset account progress" });
  await expect(resetSummary).toBeVisible();
  await resetSummary.click();
  await page
    .getByRole("button", { name: "Reset account progress", exact: true })
    .click();
  await expect.poll(() => record.state.stories.length).toBe(0);
  await page.getByRole("button", { name: "Account and sync" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByRole("button", { name: "Close preferences" }).click();
  await expect(
    page.getByRole("textbox", { name: "Story title", exact: true }),
  ).toHaveValue("Private guest draft");
});
