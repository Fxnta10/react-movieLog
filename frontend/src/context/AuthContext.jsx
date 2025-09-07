import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { AuthContext } from "./authContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Set up axios interceptor to include token in requests
  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      setToken(token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    
    // Check if user is logged in on app load
    const checkAuthStatus = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) {
          setLoading(false);
          return;
        }

        // Verify token and get user data
        const response = await axios.get("/api/me");
        if (response.data.success) {
          setUser(response.data.user);
          setToken(token);
        } else {
          // Invalid token, remove it
          logout();
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post("/api/login", {
        email,
        password,
      });

      if (response.data.success) {
        const { token, user } = response.data;
        
        // Store token in cookie (expires in 7 days)
        Cookies.set("token", token, { expires: 7 });
        
        // Set token in axios headers
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        
        setToken(token);
        setUser(user);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          message: response.data.message || "Login failed" 
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || "Login failed" 
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post("/api/register", {
        username,
        email,
        password,
      });

      if (response.data.success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          message: response.data.message || "Registration failed" 
        };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || "Registration failed" 
      };
    }
  };

  const logout = () => {
    // Remove token from cookie
    Cookies.remove("token");
    
    // Remove token from axios headers
    delete axios.defaults.headers.common["Authorization"];
    
    setToken(null);
    setUser(null);
  };

  const updateUser = async () => {
    try {
      const response = await axios.get("/api/me");
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
