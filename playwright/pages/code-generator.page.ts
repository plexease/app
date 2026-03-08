import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class CodeGeneratorPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /code generator/i });
  }

  get formInput(): Locator {
    return this.specInput;
  }

  get specInput(): Locator {
    return this.main.locator('textarea[id="spec-input"]');
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get languageSelect(): Locator {
    return this.main.locator('select[id="stack-language"]');
  }

  get firstFileCard(): Locator {
    return this.main.getByText("PaymentService.cs").locator("..");
  }

  get setupInstructionsCard(): Locator {
    return this.main.getByRole("heading", { name: "Setup instructions" }).locator("..");
  }

  get copyButton(): Locator {
    return this.main.getByText("Copy").first();
  }

  async goto() {
    await this.page.goto("/tools/code-generator");
  }

  async generateCode(spec: string, language = "csharp") {
    await this.languageSelect.selectOption(language);
    await this.specInput.fill(spec);
    await this.submitButton.click();
  }
}
