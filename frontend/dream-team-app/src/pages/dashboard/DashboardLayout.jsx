import { NavLink, Outlet, useNavigate } from "react-router-dom";

// The "frame" around every dashboard page: a sidebar that stays put,
// plus an <Outlet /> where the current page is shown.
function DashboardLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    // Later: also clear the saved login token here.
    navigate("/login");
  }

  return (
    <div className="dashboard">
      <nav className="sidebar">
        <h2>Retriever Essentials</h2>

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
