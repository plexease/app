import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class ConnectionHealthCheckPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /connection health check/i });
  }

  get formInput(): Locator {
    return this.configInput;
  }

  get configInput(): Locator {
    return this.main.locator('textarea[id="config-input"]');
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get languageSelect(): Locator {
    return this.main.locator('select[id="stack-language"]');
  }

  get configStatusCard(): Locator {
    return this.main.getByRole("heading", { name: "Configuration Status" }).locator("..");
  }

  get issuesCard(): Locator {
    return this.main.getByRole("heading", { name: "Issues" }).locator("..");
  }

  get recommendationsCard(): Locator {
    return this.main.getByRole("heading", { name: "Recommendations" }).locator("..");
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/connection-health-check");
  }

  async checkHealth(config: string, language = "csharp") {
    await this.languageSelect.selectOption(language);
    await this.configInput.fill(config);
    await this.submitButton.click();
  }
}
