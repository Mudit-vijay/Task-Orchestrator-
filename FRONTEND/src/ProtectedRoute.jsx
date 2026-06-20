import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const state = localStorage.getItem("token");
  return state ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;
