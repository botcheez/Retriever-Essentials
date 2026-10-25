import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// The "frame" around every dashboard page: a sidebar that stays put,
// plus an <Outlet /> where the current page is shown.
function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout(); // clears the saved login
    navigate("/login");
  }

  return (
    <div className="dashboard">
      <nav className="sidebar">
        <h2>Retriever Essentials</h2>
        <p className="sidebar-user">{user?.email}</p>

        {/* NavLink is like Link, but adds an "active" class on the current page.
            "end" on Home stops it from looking active on every /dashboard/... page. */}
        <NavLink to="/dashboard" end>Home</NavLink>
        <NavLink to="/dashboard/profile">Profile</NavLink>
        <NavLink to="/dashboard/settings">Settings</NavLink>
        <NavLink to="/dashboard/visuals">Visuals</NavLink>

        <button onClick={handleLogout}>Log out</button>
      </nav>

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
