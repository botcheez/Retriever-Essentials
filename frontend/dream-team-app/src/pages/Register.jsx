import { useState } from "react";
import { Link } from "react-router-dom";

function Register() {
  // One state object holds every field, instead of one useState per field.
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

    // Same rules the backend User model has (passwordHash minLength: 9)
    if (form.password.length < 9) {
      setError("Password must be at least 9 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    // Later: send the form to the backend's register route.
    console.log("Register attempt:", form);
  }

  return (
    <div className="login-page">
      <h1>Retriever Essentials</h1>
      <h2>Create an account</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>

        <label>
          Phone
          <input type="tel" name="phone" value={form.phone} onChange={handleChange} required />
        </label>

        <label>
          Organization
          <input type="text" name="organization" value={form.organization} onChange={handleChange} required />
        </label>

        <label>
          Password
          <input type="password" name="password" value={form.password} onChange={handleChange} required />
        </label>

        <label>
          Confirm password
          <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
        </label>

        {/* Only shows when error is not an empty string */}
        {error && <p className="form-error">{error}</p>}

        <button type="submit">Register</button>
      </form>

      <p className="form-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

export default Register;
