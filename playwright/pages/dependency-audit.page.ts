import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class DependencyAuditPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /dependency audit/i });
  }

  get formInput(): Locator {
    return this.dependencyInput;
  }

  get dependencyInput(): Locator {
    return this.main.locator('textarea[id="dependency-input"]');
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get languageSelect(): Locator {
    return this.main.locator('select[id="stack-language"]');
  }

  get summaryCard(): Locator {
    return this.main.getByRole("heading", { name: "Summary" }).locator("..");
  }

  get dependenciesCard(): Locator {
    return this.main.getByRole("heading", { name: "Dependencies" }).locator("..");
  }

  get recommendationsCard(): Locator {
    return this.main.getByRole("heading", { name: "Recommendations" }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/dependency-audit");
  }

  async auditDependencies(content: string, language = "csharp") {
    await this.languageSelect.selectOption(language);
    await this.dependencyInput.fill(content);
    await this.submitButton.click();
  }
}
