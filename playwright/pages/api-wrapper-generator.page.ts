import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class ApiWrapperGeneratorPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /api wrapper generator/i });
  }

  get formInput(): Locator {
    return this.apiDescriptionInput;
  }

  get apiDescriptionInput(): Locator {
    return this.main.locator('textarea[id="api-description-input"]');
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get languageSelect(): Locator {
    return this.main.locator('select[id="stack-language"]');
  }

  get firstFileCard(): Locator {
    return this.main.getByRole("heading", { name: "StripeClient.cs" }).locator("..");
  }

  get authSetupCard(): Locator {
    return this.main.getByRole("heading", { name: "Authentication Setup" }).locator("..");
  }

  get usageExampleCard(): Locator {
    return this.main.getByRole("heading", { name: "Usage Example" }).locator("..");
  }

  get copyButton(): Locator {
    return this.main.getByText("Copy").first();
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/api-wrapper-generator");
  }

  async generateWrapper(description: string, language = "csharp") {
    await this.languageSelect.selectOption(language);
    await this.apiDescriptionInput.fill(description);
    await this.submitButton.click();
  }
}
