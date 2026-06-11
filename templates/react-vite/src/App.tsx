import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  return (
    <main>
      <h1>__PROJECT_NAME__</h1>
      <p>Built offline with PackVault.</p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
