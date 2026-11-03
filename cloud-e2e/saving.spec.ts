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

test("new account keeps guest work and signing out waits for the final edit", async ({
  page,
  context,
}) => {
  let record: any = null;
  let hold = false;
  let pendingPatch = false;
  let release: (() => void) | undefined;
  await context.route("https://dco-test.supabase.co/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    };
    if (request.method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    if (url.pathname === "/auth/v1/token")
      return route.fulfill({
        json: {
          access_token: jwt,
          refresh_token: "test-refresh",
          token_type: "bearer",
          expires_in: 3600,
          user,
        },
        headers,
      });
    if (url.pathname === "/auth/v1/user")
      return route.fulfill({ json: user, headers });
    if (url.pathname === "/auth/v1/logout")
      return route.fulfill({ status: 204, headers });
    if (url.pathname === "/rest/v1/learning_records") {
      if (request.method() === "GET")
        return route.fulfill({ json: record ? [record] : [], headers });
      if (request.method() === "POST") {
        record = request.postDataJSON();
        return route.fulfill({ status: 201, json: null, headers });
      }
      if (request.method() === "PATCH") {
        if (hold) {
          pendingPatch = true;
          await new Promise<void>((resolve) => {
            release = resolve;
          });
        }
        const expected = Number(
          url.searchParams.get("revision")?.replace("eq.", ""),
        );
        if (expected !== record.revision)
          return route.fulfill({ json: [], headers });
        record = { ...record, ...request.postDataJSON() };
        return route.fulfill({
          json: [{ revision: record.revision }],
          headers,
        });
      }
    }
    return route.fulfill({
      status: 404,
      json: { message: "Unexpected endpoint" },
      headers,
    });
  });
  await page.goto("/#/interview-academy");
  await page
    .getByRole("textbox", { name: "Your response", exact: true })
    .fill("This guest answer should come with my new account.");
  await page
    .getByRole("button", { name: "Account and sync", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(user.email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("a-strong-test-password");
  await page
    .getByRole("button", { name: "Sign in", exact: true })
    .last()
    .click();
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await expect
    .poll(() => record?.state.interviewPractice?.drafts["Behavioral:0"].answer)
    .toBe("This guest answer should come with my new account.");
  await page
    .getByRole("button", { name: "Close preferences", exact: true })
    .click();
  const company = page.getByRole("combobox", {
    name: "Applying to",
    exact: true,
  });
  await company.selectOption("google");
  await page
    .getByRole("textbox", { name: "Your response", exact: true })
    .fill("Google work stays separate from my AWS answer.");
  await expect.poll(() => record?.state.targetCompany).toBe("google");
  await expect
    .poll(
      () =>
        record?.state.googleInterviewPractice?.drafts["Behavioral:0"]?.answer,
    )
    .toBe("Google work stays separate from my AWS answer.");
  await page.reload();
  await expect(company).toHaveValue("google");
  await expect(
    page.getByRole("textbox", { name: "Your response", exact: true }),
  ).toHaveValue("Google work stays separate from my AWS answer.");
  await company.selectOption("aws");
  await expect(
    page.getByRole("textbox", { name: "Your response", exact: true }),
  ).toHaveValue("This guest answer should come with my new account.");
  await company.selectOption("google");
  hold = true;
  await page
    .getByRole("textbox", { name: "Your response", exact: true })
    .fill("An edit with an account save still in flight.");
  await expect.poll(() => pendingPatch).toBe(true);
  await page
    .getByRole("textbox", { name: "Your response", exact: true })
    .fill("The final edit must also reach my account before sign-out.");
  await page
    .getByRole("button", { name: "Account and sync", exact: true })
    .click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  hold = false;
  release?.();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }).first(),
  ).toBeVisible();
  expect(
    record.state.googleInterviewPractice.drafts["Behavioral:0"].answer,
  ).toBe("The final edit must also reach my account before sign-out.");
  await page
    .getByRole("button", { name: "Close preferences", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Your response", exact: true }),
  ).toHaveValue("This guest answer should come with my new account.");
});
