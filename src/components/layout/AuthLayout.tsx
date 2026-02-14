import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div className="bg-bg-app flex min-h-screen items-center justify-center p-4">
      <div className="card-surface w-full max-w-md p-8">
        <Outlet />
      </div>
    </div>
  );
}
