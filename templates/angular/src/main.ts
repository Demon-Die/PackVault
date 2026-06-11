import { bootstrapApplication } from "@angular/platform-browser";
import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  standalone: true,
  template: `
    <main>
      <h1>__PROJECT_NAME__</h1>
      <p>Built offline with PackVault.</p>
    </main>
  `
})
class AppComponent {}

bootstrapApplication(AppComponent);
