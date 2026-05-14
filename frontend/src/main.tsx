import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

async function prepare() {
  if (import.meta.env.VITE_MOCK === "true") {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "warn" });
  }
}

prepare().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
