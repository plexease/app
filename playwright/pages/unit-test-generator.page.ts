import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class UnitTestGeneratorPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /unit test generator/i });
  }

  get formInput(): Locator {
    return this.codeInput;
  }

  get codeInput(): Locator {
    return this.main.locator('textarea[id="code-input"]');
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get languageSelect(): Locator {
    return this.main.locator('select[id="stack-language"]');
  }

  get firstFileCard(): Locator {
    return this.main.getByRole("heading", { name: "PaymentServiceTests.cs" }).locator("..");
  }

  get testFrameworkCard(): Locator {
    return this.main.getByRole("heading", { name: "Test Framework" }).locator("..");
  }

  get mockingApproachCard(): Locator {
    return this.main.getByRole("heading", { name: "Mocking Approach" }).locator("..");
  }

  get copyButton(): Locator {
    return this.main.getByText("Copy").first();
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/unit-test-generator");
  }

  async generateTests(code: string, language = "csharp") {
    await this.languageSelect.selectOption(language);
    await this.codeInput.fill(code);
    await this.submitButton.click();
  }
}
