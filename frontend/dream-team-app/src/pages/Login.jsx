import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// A component is just a function that returns JSX (HTML-like markup).
function Login() {
  // useState remembers values between renders.
  // [currentValue, functionToChangeIt] = useState(startingValue)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // lets us change pages from code

  // Runs when the form is submitted.
  function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    // Later this is where we will send email + password to the backend.
    console.log("Login attempt:", email, password);
    // TEMPORARY: go straight to the dashboard. Replace with a real login check.
    navigate("/dashboard");
  }

  return (
    <div className="login-page">
      <h1>Retriever Essentials</h1>
      <h2>Log in</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit">Log in</button>
      </form>

      <p className="form-switch">
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default Login;
