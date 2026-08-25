import React from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";

export function Loader({ label = "Chargement..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-pop-dark/50">
      <div className="w-8 h-8 border-4 border-pop-orange/30 border-t-pop-orange rounded-full animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ icon = "🍽️", title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center text-pop-dark/50">
      <span className="text-4xl">{icon}</span>
      <p className="font-semibold text-pop-dark">{title}</p>
      {subtitle && <p className="text-sm">{subtitle}</p>}
    </div>
  );
}

export function ProtectedAdminRoute({ children }) {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
}
