import { expect, test, type Page } from "@playwright/test";

async function loadExample(page: Page, example: 0 | 1): Promise<void> {
  await page.goto("/");
  await expect(page.getByText("Welkom op ééndraadschema")).toBeVisible();
  await page.locator(`button[onclick="load_example(${example})"]`).click();
  await expect(page.getByRole("navigation", { name: "Elektrische hiërarchie" })).toBeVisible();
}

test("loads an example into the React editor with a live SVG preview", async ({ page }) => {
  await loadExample(page, 1);

  await expect(page.locator("#react-hierarchy-root [data-hierarchy-item-id]").first()).toBeVisible();
  await expect(page.locator("#right_col_inner #EDS svg")).toBeVisible();
  await expect(page.getByRole("contentinfo", { name: "Statusbalk van de editor" })).toBeVisible();
});

test("edits a circuit property through React and updates the SVG", async ({ page }) => {
  await loadExample(page, 1);

  // Rows start collapsed; reveal a circuit through the editor search.
  await page.getByRole("searchbox", { name: "Zoeken in het schema" }).fill("Kring");
  await page.locator(".react-hierarchy-search__results button").first().click();

  const propertiesPanel = page.locator("#react-properties-root");
  await expect(propertiesPanel.getByRole("heading", { name: "Eigenschappen" })).toBeVisible();

  await propertiesPanel.getByText("Geavanceerde instellingen").click();
  const addressField = propertiesPanel.getByLabel("Adres", { exact: true });
  await addressField.fill("Smoketest-adres");
  await addressField.blur();

  await expect(page.locator("#right_col_inner #EDS svg")).toContainText("Smoketest-adres");

  const undoButton = page.getByRole("button", { name: "Ongedaan maken" });
  await undoButton.click();
  await expect(page.locator("#right_col_inner #EDS svg")).not.toContainText("Smoketest-adres");

  await page.getByRole("button", { name: "Opnieuw" }).click();
  await expect(page.locator("#right_col_inner #EDS svg")).toContainText("Smoketest-adres");
});

test("search reveals and selects a matching item", async ({ page }) => {
  await loadExample(page, 1);

  const searchInput = page.getByRole("searchbox", { name: "Zoeken in het schema" });
  await searchInput.fill("Lichtpunt");
  await expect(page.locator(".react-hierarchy-search__results")).toContainText("gevonden");

  await page.locator(".react-hierarchy-search__results button").first().click();
  await expect(searchInput).toHaveValue("");
  await expect(page.locator("#react-hierarchy-root [aria-current='true']")).toBeVisible();
});

test("adds a secondary board, shows breadcrumbs, and deletes it again", async ({ page }) => {
  await loadExample(page, 1);

  await page.getByText("+ Verdeelbord toevoegen").click();
  const addForm = page.locator(".board-navigator__add form");
  await addForm.getByLabel("Naam").fill("Garage");
  await addForm.locator("select").selectOption({ index: 1 });
  await addForm.getByRole("button", { name: "Verdeelbord toevoegen" }).click();

  await expect(page.locator(".board-navigator__list")).toContainText("Garage");
  const breadcrumbs = page.getByRole("navigation", { name: /Voedingspad/ });
  await expect(breadcrumbs).toContainText("Hoofdbord");
  await expect(breadcrumbs).toContainText("Garage");

  page.on("dialog", (dialog) => dialog.accept());
  await page.getByText("Instellingen van Garage").click();
  await page.getByRole("button", { name: "Verdeelbord verwijderen" }).click();
  await expect(page.locator(".board-navigator__list")).not.toContainText("Garage");
});

test("status bar zoom controls scale the SVG preview", async ({ page }) => {
  await loadExample(page, 0);

  const statusbar = page.getByRole("contentinfo", { name: "Statusbalk van de editor" });
  await statusbar.getByRole("button", { name: "Inzoomen" }).click();
  await expect(statusbar.getByRole("button", { name: "Zoom terugzetten naar 100 procent" })).toHaveText("125%");
  await expect(page.locator("#right_col_inner")).toHaveCSS("zoom", "1.25");

  await statusbar.getByRole("button", { name: "Zoom terugzetten naar 100 procent" }).click();
  await expect(statusbar.getByRole("button", { name: "Zoom terugzetten naar 100 procent" })).toHaveText("100%");
});

test("situation plan React controls manage pages", async ({ page }) => {
  await loadExample(page, 0);
  await page.locator("#minitabs").getByText("Situatieschema", { exact: true }).click();
  const helpDialogOk = page.getByRole("button", { name: "OK" });
  if (await helpDialogOk.isVisible()) await helpDialogOk.click();

  const controls = page.getByRole("region", { name: "Situatieplan pagina's" });
  const pageSelect = controls.getByLabel("Pagina", { exact: true });
  await expect(pageSelect).toHaveValue("1");

  const zoomControls = page.getByRole("region", { name: "Situatieplan zoom" });
  await expect(page.locator("#button_zoomin:visible, #button_zoomout:visible, #button_zoomToFit:visible")).toHaveCount(0);
  const paper = page.locator("#paper");
  const fittedTransform = await paper.evaluate((element) => element.style.transform);
  await zoomControls.getByRole("button", { name: "Inzoomen" }).click();
  await expect.poll(() => paper.evaluate((element) => element.style.transform)).not.toBe(fittedTransform);
  await zoomControls.getByRole("button", { name: "Schermvullend" }).click();
  await expect.poll(() => paper.evaluate((element) => element.style.transform)).toBe(fittedTransform);

  await controls.getByRole("button", { name: "Nieuw" }).click();
  await expect(pageSelect).toHaveValue("2");
  await expect(pageSelect.locator("option")).toHaveCount(2);

  await pageSelect.selectOption("1");
  await expect(controls.getByRole("button", { name: "Nieuw" })).toBeDisabled();

  await pageSelect.selectOption("2");
  page.once("dialog", (dialog) => dialog.accept());
  await controls.getByRole("button", { name: "Pagina 2 verwijderen" }).click();
  await expect(pageSelect).toHaveValue("1");
  await expect(pageSelect.locator("option")).toHaveCount(1);
});

test("print page renders a preview through the print adapter", async ({ page }) => {
  await loadExample(page, 1);

  await page.locator("#minitabs").getByText("Print", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Genereer PDF" })).toBeVisible();
  await expect(page.locator("#printsvgarea svg").first()).toBeVisible();

  await page.locator("#minitabs").getByText("Eéndraadschema", { exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Elektrische hiërarchie" })).toBeVisible();
});
