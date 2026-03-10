import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class ToolFinderPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /tool finder/i });
  }

  get formInput(): Locator {
    return this.queryInput;
  }

  get queryInput(): Locator {
    return this.main.locator('textarea[id="query-input"]');
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get languageSelect(): Locator {
    return this.main.locator('select[id="stack-language"]');
  }

  get recommendationCard(): Locator {
    return this.main.getByRole("heading", { name: "Recommendation" }).locator("..");
  }

  get alternativesCard(): Locator {
    return this.main.getByRole("heading", { name: "Alternatives" }).locator("..");
  }

  get compatibilityCard(): Locator {
    return this.main.getByRole("heading", { name: "Compatibility" }).locator("..");
  }

  get versionAdviceCard(): Locator {
    return this.main.getByRole("heading", { name: "Version Advice" }).locator("..");
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/tool-finder");
  }

  async advise(query: string, language = "csharp") {
    await this.languageSelect.selectOption(language);
    await this.queryInput.fill(query);
    await this.submitButton.click();
  }
}
