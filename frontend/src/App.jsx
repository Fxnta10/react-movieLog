import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Watchlist from "../pages/Watchlist";
import SearchResult from "../pages/SearchResult";
import Layout from "../components/Layout";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Layout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="watchlist" element={<Watchlist />} />
        <Route path="search/:title" element={<SearchResult />} />
        {/* <Route path="discover" element={<Discover />} /> */}
        {/* <Route path="profile" element={<Profile />} /> */}
      </Route>
    </Routes>
  );
}
