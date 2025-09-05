import React from "react";
import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";
export default function Navbar() {
  return (
    <>
      <Link to="/dashboard">FlickStack</Link>
      <Link to="/watchlist">Watchlist</Link>
      <Link to="/discover">Discover</Link>
      <Link to="/profile">Profile</Link>
      <SearchBar />
    </>
  );
}
