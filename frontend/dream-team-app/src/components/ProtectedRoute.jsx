import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps routes that need a login. Logged in -> show the child routes.
// Not logged in -> send to /login.
function ProtectedRoute() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
