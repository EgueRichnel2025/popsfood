import React, { createContext, useContext, useState } from "react";
import { api } from "../api/client";

const AdminAuthContext = createContext(null);
const TOKEN_KEY = "popsfood_admin_token";
const NAME_KEY = "popsfood_admin_name";

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [adminName, setAdminName] = useState(() => localStorage.getItem(NAME_KEY));

  async function login(email, password) {
    const data = await api.post("/api/admin/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(NAME_KEY, data.admin_name);
    setToken(data.access_token);
    setAdminName(data.admin_name);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NAME_KEY);
    setToken(null);
    setAdminName(null);
  }

  return (
    <AdminAuthContext.Provider value={{ token, adminName, isAuthenticated: !!token, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
