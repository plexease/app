import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class ConnectionMapPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /connection map/i });
  }

  get formInput(): Locator {
    return this.platformsInput;
  }

  get platformsInput(): Locator {
    return this.main.locator('textarea[id="platforms-input"]');
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get connectionsSection(): Locator {
    return this.main.getByRole("heading", { name: /connections/i }).locator("..");
  }

  get weakPointsSection(): Locator {
    return this.main.getByRole("heading", { name: /weak points/i }).locator("..");
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/connection-map");
  }

  async mapConnections(platforms: string) {
    await this.platformsInput.fill(platforms);
    await this.submitButton.click();
  }
}
