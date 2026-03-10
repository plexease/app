import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class ToolPlannerPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /tool planner/i });
  }

  get formInput(): Locator {
    return this.descriptionInput;
  }

  get descriptionInput(): Locator {
    return this.main.locator('textarea[id="description-input"]');
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get recommendationsSection(): Locator {
    return this.main.getByRole("heading", { name: /recommended tools/i }).locator("..");
  }

  get stackOverviewCard(): Locator {
    return this.main.getByRole("heading", { name: /stack overview/i }).locator("..");
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/tool-planner");
  }

  async planTools(description: string) {
    await this.descriptionInput.fill(description);
    await this.submitButton.click();
  }
}
