import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class ErrorExplainerPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /error explainer/i });
  }

  get formInput(): Locator {
    return this.errorLogInput;
  }

  get errorLogInput(): Locator {
    return this.main.locator('textarea[id="error-log-input"]');
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get languageSelect(): Locator {
    return this.main.locator('select[id="stack-language"]');
  }

  get rootCauseCard(): Locator {
    return this.main.getByRole("heading", { name: "Root Cause" }).locator("..");
  }

  get fixSuggestionsCard(): Locator {
    return this.main.getByRole("heading", { name: "Fix Suggestions" }).locator("..");
  }

  get relatedDocsCard(): Locator {
    return this.main.getByRole("heading", { name: "Related Documentation" }).locator("..");
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/error-explainer");
  }

  async analyseError(errorLog: string, language = "csharp") {
    await this.languageSelect.selectOption(language);
    await this.errorLogInput.fill(errorLog);
    await this.submitButton.click();
  }
}
