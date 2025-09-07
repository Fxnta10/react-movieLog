import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../src/hooks/useAuth";

export default function Register() {
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await register(username, email, password);
      
      if (result.success) {
        navigate("/login");
      } else {
        setError(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleRegister}>
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
            <label>Username:</label>
            <br />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div>
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </>
  );
}
