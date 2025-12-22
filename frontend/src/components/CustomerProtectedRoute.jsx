import { Navigate } from "react-router-dom";

export default function CustomerProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "Customer") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
