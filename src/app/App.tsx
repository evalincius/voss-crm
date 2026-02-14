import { RouterProvider } from "react-router";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, QueryProvider, ThemeProvider } from "@/providers";
import { router } from "./router";

export function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider delayDuration={300}>
              <RouterProvider router={router} />
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
