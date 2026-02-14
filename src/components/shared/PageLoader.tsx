import { LoadingSpinner } from "./LoadingSpinner";

export function PageLoader() {
  return (
    <div className="bg-bg-app flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
