import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Input from "../components/Input";
import Button from "../components/Button";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  function handleSubmit(event) {
    event.preventDefault();

    // TEMPORARY FAKE LOGIN: replace with the real backend call once the
    // auth route exists, e.g.:
    //   const data = await post("/auth/login", { email, password });
    //   login(data.user, data.token);
    login({ email }, "fake-token");
    navigate("/dashboard");
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
        <Button type="submit">Log in</Button>
      </form>

      <p className="form-switch">
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default Login;
