import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class WorkflowBuilderPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /workflow builder/i });
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

  get triggerSection(): Locator {
    return this.main.getByRole("heading", { name: /trigger/i }).locator("..");
  }

  get stepsSection(): Locator {
    return this.main.getByRole("heading", { name: /workflow steps/i }).locator("..");
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/workflow-builder");
  }

  async designWorkflow(description: string) {
    await this.descriptionInput.fill(description);
    await this.submitButton.click();
  }
}
