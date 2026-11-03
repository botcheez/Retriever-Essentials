import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { post } from "../api";

import Input from "../components/Input";
import Button from "../components/Button";

function Register() {

  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    phone: "",
    organization: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  // One handler for all inputs: each input's "name" says which field to update.
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  //handle submit function
  async function handleSubmit(e) {
      e.preventDefault();

      if (form.password.length < 9) {
          setError("Password must be at least 9 characters.");
          return;
      }

      if (form.password !== form.confirmPassword) {
          setError("Passwords do not match.");
          return;
      }

      setError("");
      setLoading(true);

      try {

          const data = await post("/auth/register", {
              email: form.email,
              phone: form.phone,
              organization: form.organization,
              password: form.password
          });

          //registration also logs the new user in
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
      <h2>Create an account</h2>

      <form onSubmit={handleSubmit}>
        <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} required />
        <Input label="Phone" type="tel" name="phone" value={form.phone} onChange={handleChange} required />
        <Input label="Organization" type="text" name="organization" value={form.organization} onChange={handleChange} required />
        <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} required />
        <Input label="Confirm password" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />

        {error && <p className="form-error">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </Button>
      </form>

      <p className="form-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

export default Register;
