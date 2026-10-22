import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Profile from "./pages/dashboard/Profile";
import Settings from "./pages/dashboard/Settings";
import Visuals from "./pages/dashboard/Visuals";

// BrowserRouter turns on URL-based routing for everything inside it.
// Routes looks at the current URL and shows the first Route that matches.
function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Nested routes: DashboardLayout is always shown, and the child
              route decides what appears in its <Outlet />. */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="visuals" element={<Visuals />} />
          </Route>

          {/* Visiting "/" (or anything unknown) sends you to /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
