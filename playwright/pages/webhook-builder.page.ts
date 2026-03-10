import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class WebhookBuilderPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /webhook builder/i });
  }

  get formInput(): Locator {
    return this.sourceAppInput;
  }

  get sourceAppInput(): Locator {
    return this.main.locator("input#source-app-input");
  }

  get targetAppInput(): Locator {
    return this.main.locator("input#target-app-input");
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get sourceSetupSection(): Locator {
    return this.main.getByRole("heading", { name: /source setup/i }).locator("..");
  }

  get targetSetupSection(): Locator {
    return this.main.getByRole("heading", { name: /target setup/i }).locator("..");
  }

  get payloadFormatSection(): Locator {
    return this.main.getByRole("heading", { name: /payload format/i }).locator("..");
  }

  get testingSection(): Locator {
    return this.main.getByRole("heading", { name: /testing/i }).locator("..");
  }

  get securityNotesSection(): Locator {
    return this.main.getByRole("heading", { name: /security notes/i }).locator("..");
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/webhook-builder");
  }

  async buildWebhook(source: string, target: string) {
    await this.sourceAppInput.fill(source);
    await this.targetAppInput.fill(target);
    await this.submitButton.click();
  }
}
