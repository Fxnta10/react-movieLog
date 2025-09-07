import React from "react";
import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";
import { useAuth } from "../src/hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center",
      padding: "1rem",
      borderBottom: "1px solid #ccc"
    }}>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Link to="/dashboard">FlickStack</Link>
        <Link to="/watchlist">Watchlist</Link>
        <Link to="/discover">Discover</Link>
        <Link to="/profile">Profile</Link>
      </div>
      
      <SearchBar />
      
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span>Welcome, {user?.username || user?.email}!</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
