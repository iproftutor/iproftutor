"use client";

import { usePathname } from "next/navigation";
import AdminSidePanel from "./components/SidePanel";
import AdminHeader from "./components/Header";
import { AdminProvider } from "./context/AdminContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Pages that should NOT show the admin layout (sign-in, unauthorized)
  const isAuthPage =
    pathname === "/admin/sign-in" || pathname === "/admin/unauthorized";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <AdminProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminSidePanel />
        <div className="ml-64 flex flex-col min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </AdminProvider>
  );
}
