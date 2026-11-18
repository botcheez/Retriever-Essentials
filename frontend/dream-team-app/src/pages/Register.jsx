import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";

function Register() {
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

  function handleSubmit(e) {
    e.preventDefault();

    // Same rule as the backend User model (passwordHash minLength: 9)
    if (form.password.length < 9) {
      setError("Password must be at least 9 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    // Later: await post("/auth/register", form) using the helper in api.js
    console.log("Register attempt:", form);
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

        <Button type="submit">Register</Button>
      </form>

      <p className="form-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

export default Register;
