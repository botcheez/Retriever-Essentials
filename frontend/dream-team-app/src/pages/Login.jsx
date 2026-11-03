import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Input from "../components/Input";
import Button from "../components/Button";
import { post } from "../api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  //error/loading state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  //
  async function handleSubmit(event) {
      event.preventDefault();

      setError("");
      setLoading(true);

      try {

          const data = await post("/auth/login", {
              email,
              password
          });

          login(data.user, data.token);

          navigate("/dashboard");

      }

      catch (err) {

          setError(err.message);

      }

      finally {

          setLoading(false);
      }
  }

  return (
    <div className="login-page">
      <h1>Retriever Essentials</h1>
      <h2>Log in</h2>

      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* Button Submit + button error state + loading state */}
        {error && <p className="form-error">{error}</p>}
        <Button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <p className="form-switch">
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default Login;
