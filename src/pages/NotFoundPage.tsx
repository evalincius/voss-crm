import { Link } from "react-router";
import { ROUTES } from "@/lib/constants";

export function NotFoundPage() {
  return (
    <div className="bg-bg-app flex min-h-screen items-center justify-center p-4">
      <div className="card-surface max-w-md p-8 text-center">
        <h1 className="font-heading text-primary mb-2 text-6xl font-bold">404</h1>
        <h2 className="font-heading text-text-primary mb-2 text-xl font-semibold">
          Page not found
        </h2>
        <p className="text-text-secondary mb-6 text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          to={ROUTES.DASHBOARD}
          className="bg-primary text-primary-foreground hover:bg-primary-hover inline-flex h-10 items-center rounded-md px-4 text-sm font-medium"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
