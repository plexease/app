import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class CodeExplainerPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /code explainer/i });
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

  get explanationCard(): Locator {
    return this.main.getByRole("heading", { name: "Explanation" }).locator("..");
  }

  get detectedPackagesCard(): Locator {
    return this.main.getByRole("heading", { name: "Detected packages" }).locator("..");
  }

  get detectedPatternsCard(): Locator {
    return this.main.getByRole("heading", { name: "Detected patterns" }).locator("..");
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/code-explainer");
  }

  async explainCode(code: string, language = "csharp") {
    await this.languageSelect.selectOption(language);
    await this.codeInput.fill(code);
    await this.submitButton.click();
  }
}
