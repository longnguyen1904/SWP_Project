import { Navigate } from "react-router-dom";
import { getToken } from "../services/localStorageService";

export default function ProtectedRoute({ children }) {
  const token = getToken();

  if (!token) {
    return <Navigate to="/authenticate" replace />;
  }

  return children;
}