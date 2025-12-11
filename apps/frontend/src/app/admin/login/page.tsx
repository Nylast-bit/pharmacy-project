"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const HASHED_PASSWORD = "$2b$10$92fGgm/u1P77MnGkdaJcJuKqUY5VodFlJW.XB4fpaixu0XcwznBbC"; 

function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const bcrypt = await import("bcryptjs");
      const match = await bcrypt.compare(password, HASHED_PASSWORD);
      if (match) {
        sessionStorage.setItem("isAdminAuth", "true");
        router.push("/admin");
      } else {
        setError("Incorrect password");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100">
      {/* Botón para volver al Home */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 bg-[#00a2b9] hover:bg-[#0094a7] text-white px-4 py-2 rounded-lg font-semibold"
      >
        Home
      </button>

      {/* Formulario centrado */}
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold text-center mb-4 text-[#00a2b9]">
          Admin Access
        </h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#00a2b9]"
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <button
          type="submit"
          className="w-full bg-[#00a2b9] hover:bg-[#0094a7] text-white py-2 rounded-lg font-semibold"
        >
          Enter
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
