import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class NuGetAdvisorPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /nuget advisor/i });
  }

  get formInput(): Locator {
    return this.packageInput;
  }

  get packageInput(): Locator {
    return this.main.locator('input[id="package-name"]');
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get whatItDoesCard(): Locator {
    return this.main.getByText("What it does").locator("..");
  }

  get alternativesCard(): Locator {
    return this.main.getByText("Alternatives").locator("..");
  }

  get compatibilityCard(): Locator {
    return this.main.getByText("Compatibility").locator("..");
  }

  get versionAdviceCard(): Locator {
    return this.main.getByText("Version advice").locator("..");
  }

  async goto() {
    await this.page.goto("/tools/nuget-advisor");
  }

  async analysePackage(name: string) {
    await this.packageInput.fill(name);
    await this.submitButton.click();
  }
}
