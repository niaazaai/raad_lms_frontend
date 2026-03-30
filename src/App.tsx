import { AppRoutes } from "./routes";
import { Toaster } from "sonner";
import { initializeTheme } from "./store";
import { useEffect } from "react";
import { ConfirmDialogProvider } from "./components/ui";

function App() {
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <ConfirmDialogProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          className: "text-sm",
        }}
      />
    </ConfirmDialogProvider>
  );
}

export default App;
