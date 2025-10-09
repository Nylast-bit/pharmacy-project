"use client";

import { useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut } from "lucide-react";

const Sidebar = () => {
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/admin" },
    { name: "Orders", icon: <ShoppingCart size={20} />, path: "/admin/orders" },
    { name: "Products", icon: <Package size={20} />, path: "/admin/products" },
    { name: "Customers", icon: <Users size={20} />, path: "/admin/customers" },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem("isAdminAuth");
    router.push("/admin/login");
  };

  return (
    <div className="h-screen w-64 bg-[#00a2b9] text-white flex flex-col justify-between p-4">
      {/* Top section */}
      <div>
        <div className="flex items-center justify-center mb-8">
          <img src="/logo-placeholder.png" alt="Logo" className="w-12 h-12 rounded-full bg-white" />
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => router.push(item.path)}
              className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-[#0094a7] transition"
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="space-y-2">
       
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-red-500 transition"
        >
          <LogOut className="mr-3" size={20} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
