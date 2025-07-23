import { test, expect } from "@playwright/test";

test("ログインできること。", async ({ page }) => {
  await page.goto("http://localhost:3001/");
  await page.getByRole("link", { name: "検索を開始" }).click();
  await page.getByRole("textbox", { name: "メールアドレス" }).click();
  await page
    .getByRole("textbox", { name: "メールアドレス" })
    .fill("t.kuboki@zerictor.com");
  await page.getByRole("textbox", { name: "メールアドレス" }).press("Tab");
  await page.getByRole("textbox", { name: "••••••••" }).fill("test123!!");
  await page.getByRole("button", { name: "ログイン" }).click();
});
