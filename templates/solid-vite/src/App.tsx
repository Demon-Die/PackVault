import { render } from "solid-js/web";
import "./style.css";

function App() {
  return (
    <main>
      <h1>__PROJECT_NAME__</h1>
      <p>Built offline with PackVault.</p>
    </main>
  );
}

render(() => <App />, document.getElementById("root")!);
