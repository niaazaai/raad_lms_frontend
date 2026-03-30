import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import "./assets/css/index.css";
import App from "./App";
import { QueryProvider } from "./providers/QueryProvider";
import ErrorFallback from "./components/errors/ErrorFallback";

// Get root element
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

// Create root and render app
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
          <App />
        </ErrorBoundary>
      </QueryProvider>
    </BrowserRouter>
  </StrictMode>
);
