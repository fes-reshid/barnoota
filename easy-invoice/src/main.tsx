import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppProvider } from "./app/AppProvider";
import { ToastProvider } from "./components/ui/Toast";
import { isFirebaseConfigured } from "./lib/firebase";
import { SetupRequiredPage } from "./pages/SetupRequiredPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isFirebaseConfigured ? (
      <ToastProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ToastProvider>
    ) : (
      <SetupRequiredPage />
    )}
  </StrictMode>,
);
