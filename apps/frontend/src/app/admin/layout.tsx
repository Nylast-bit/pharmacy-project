"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/app/components/SideBar";

interface AdminLayoutProps {
  children: ReactNode;
}

function AdminLayout({ children }: AdminLayoutProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Evita proteger el login
    if (pathname === "/admin/login") return;

    const isAuthed = sessionStorage.getItem("isAdminAuth") === "true";
    if (!isAuthed) router.push("/admin/login");
    else setAuthenticated(true);
  }, [router, pathname]);

  // Si estamos en login, renderiza sin chequear auth
  if (pathname === "/admin/login") return <>{children}</>;

  if (!authenticated) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white shadow flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-[#00a2b9]">Admin Panel</h1>
          <p className="text-gray-600">Welcome, Admin</p>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default  AdminLayout;

