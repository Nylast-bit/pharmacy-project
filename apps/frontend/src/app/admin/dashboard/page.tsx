"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface DashboardStats {
  orders: number;
  products: number;
  customers: number;
}

interface SalesData {
  date: string;
  total: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ orders: 0, products: 0, customers: 0 });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/orders`),
        fetch(`${API_BASE_URL}/api/products`),
        fetch(`${API_BASE_URL}/api/customers`),
      ]);

      const [orders, products, customers] = await Promise.all([
        ordersRes.json(),
        productsRes.json(),
        customersRes.json(),
      ]);

      setStats({
        orders: Array.isArray(orders) ? orders.length : 0,
        products: Array.isArray(products) ? products.length : 0,
        customers: Array.isArray(customers) ? customers.length : 0,
      });

      // Gráfico de ventas (si tienes endpoint)
      const salesRes = await fetch(`${API_BASE_URL}/api/orders/sales-by-day`);
      if (salesRes.ok) {
        const data = await salesRes.json();
        setSalesData(data);
      }

    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-[#00a2b9]">Dashboard Overview</h2>

      {loading ? (
        <p className="text-gray-500">Loading data...</p>
      ) : (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-700">📦 Products</h3>
              <p className="text-3xl font-bold mt-2">{stats.products}</p>
              <p className="text-sm text-gray-500 mt-1">Total registered products</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-gray-700">📊 Orders</h3>
              <p className="text-3xl font-bold mt-2">{stats.orders}</p>
              <p className="text-sm text-gray-500 mt-1">Completed or pending orders</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-orange-500">
              <h3 className="text-lg font-semibold text-gray-700">👥 Customers</h3>
              <p className="text-3xl font-bold mt-2">{stats.customers}</p>
              <p className="text-sm text-gray-500 mt-1">Active registered clients</p>
            </div>
          </div>

          {/* Sales Chart */}
          {salesData.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">📈 Sales (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#00a2b9" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          
        </>
      )}
    </div>
  );
}
