import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "UC Markdown Playground" })).toBeVisible();
});

test("initializes the Markdown fixture and publishes real keyboard edits", async ({ page }) => {
  const editor = page.locator(".ProseMirror");

  await expect(editor).toHaveAttribute("contenteditable", "true");
  await expect(page.locator("#markdown-output")).toContainText("# Markdown playground");

  await editor.click();
  await editor.press("Control+End");
  await editor.press("Enter");
  await editor.pressSequentially("E2E keyboard typing");

  await expect(page.locator("#markdown-output")).toContainText("E2E keyboard typing");
  await expect(page.locator("#status")).toContainText("subscribe()");
});

test("supports keyboard tab navigation and public commands", async ({ page }) => {
  const editor = page.locator(".ProseMirror");

  await page.locator("#fixture-select").focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#load-fixture")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#markdown-input")).toBeFocused();

  await editor.click();
  await editor.press("Control+A");
  await page.getByRole("button", { name: "굵게" }).click();

  await expect(page.locator("#status")).toContainText("commands.toggleBold()");
  await expect(page.locator("#markdown-output")).toContainText("**");
  await page.getByRole("button", { name: "현재 Markdown 조회" }).click();
  await expect(page.locator("#status")).toContainText("getMarkdown()");
});

test("normalizes allowed and malicious HTML through the editor paste path", async ({ page }) => {
  const output = page.locator("#dom-output");

  await page.locator("#paste-select").selectOption("allowed");
  await page.getByRole("button", { name: "편집 DOM에 붙여넣기" }).click();
  await expect(page.locator("#markdown-output")).toContainText("Paste title");
  await expect(output).toContainText("Paste title");

  await page.getByRole("button", { name: "시나리오 불러오기" }).click();
  await page.locator("#paste-select").selectOption("malicious");
  await page.getByRole("button", { name: "편집 DOM에 붙여넣기" }).click();

  await expect(page.locator("#markdown-output")).toContainText("unsafe");
  await expect(page.locator("#markdown-output")).toContainText("plain");
  await expect(output).not.toContainText("onclick");
  await expect(output).not.toContainText("<script");
  await expect(output).not.toContainText("<iframe");
  await expect(output).not.toContainText("javascript:");
});

test("imports and serializes mixed GFM task and regular list items", async ({ page }) => {
  const pageErrors: Error[] = [];
  const mixedList = "- 일반 항목\n- [x] 완료 항목\n- [ ] 미완료 항목\n";
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.locator("#markdown-input").fill(mixedList);
  await page.getByRole("button", { name: "Markdown으로 다시 만들기" }).click();

  await expect(page.locator("#status")).toContainText("입력 Markdown");
  await expect(page.locator("#markdown-output")).toContainText("일반 항목");
  await expect(page.locator("#markdown-output")).toContainText("[x] 완료 항목");
  await expect(page.locator("#markdown-output")).toContainText("[ ] 미완료 항목");
  expect(pageErrors).toEqual([]);
});

test("reports no critical or serious WCAG 2.2 A/AA axe violations", async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  const blockingViolations = results.violations.filter(({ impact }) => impact === "critical" || impact === "serious");

  expect(blockingViolations).toEqual([]);
});

test("disposes the editor cleanly when the page exits", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto("about:blank");
  await expect(page).toHaveURL("about:blank");
  expect(pageErrors).toEqual([]);
});
