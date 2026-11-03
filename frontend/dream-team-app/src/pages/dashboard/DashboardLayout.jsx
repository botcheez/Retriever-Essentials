import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Dashboard.css"

// The frame around every dashboard page.
function DashboardLayout() {

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="dashboard">

      <nav className="sidebar">

        <h2>Retriever Essentials</h2>

        <p className="sidebar-user">
          {user?.email}
        </p>

        <NavLink to="/dashboard" end>
          Home
        </NavLink>

        <NavLink to="/dashboard/uploads">
          Uploads
        </NavLink>

        <NavLink to="/dashboard/visuals">
          Visuals
        </NavLink>

        <NavLink to="/dashboard/profile">
          Profile
        </NavLink>

        <NavLink to="/dashboard/settings">
          Settings
        </NavLink>

        <button onClick={handleLogout}>
          Log out
        </button>

      </nav>

      <main className="dashboard-content">
        <Outlet />
      </main>

    </div>
  );
}

export default DashboardLayout;