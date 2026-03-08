import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class MigrationAssistantPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /migration assistant/i });
  }

  get formInput(): Locator {
    return this.codeInput;
  }

  get migratingFromInput(): Locator {
    return this.main.locator('input[id="migrating-from"]');
  }

  get migratingToInput(): Locator {
    return this.main.locator('input[id="migrating-to"]');
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

  get migrationStepsCard(): Locator {
    return this.main.getByRole("heading", { name: "Migration Steps" }).locator("..");
  }

  get breakingChangesCard(): Locator {
    return this.main.getByRole("heading", { name: "Breaking Changes" }).locator("..");
  }

  get estimatedEffortCard(): Locator {
    return this.main.getByRole("heading", { name: "Estimated Effort" }).locator("..");
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/migration-assistant");
  }

  async planMigration(from: string, to: string, code: string, language = "csharp") {
    await this.languageSelect.selectOption(language);
    await this.migratingFromInput.fill(from);
    await this.migratingToInput.fill(to);
    await this.codeInput.fill(code);
    await this.submitButton.click();
  }
}
