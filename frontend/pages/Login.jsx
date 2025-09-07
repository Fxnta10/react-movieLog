import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../src/hooks/useAuth";

export default function Login() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(email, password);
      
      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ maxWidth: "400px", margin: "100px auto" }}>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div>
        <Link to="/register">Register</Link>
      </div>
    </div>
  );
}
