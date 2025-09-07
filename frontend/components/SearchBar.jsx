import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const [title, setTitle] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  const navigate = useNavigate();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const performSearch = async (searchTitle = title) => {
    if (!searchTitle.trim()) return;

    try {
      setError(null);
      setIsLoading(true);
      setShowSuggestions(false);

      const response = await axios.get(
        `/api/search?title=${encodeURIComponent(searchTitle)}`
      );

      if (!response.data.success) {
        setError(
          response.data.error || "Something went wrong with the search."
        );
        return;
      }

      // Navigate to search results page with the data
      navigate(`/search/${encodeURIComponent(searchTitle)}`, {
        state: response.data.data,
      });
    } catch (err) {
      console.error("Error during search:", err);
      setError("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestions = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await axios.get(
        `/api/search?title=${encodeURIComponent(searchTerm)}`
      );

      if (response.data.success && response.data.data) {
        // Take first 5 suggestions
        const suggestions = response.data.data.slice(0, 5).map((movie) => ({
          title: movie.Title,
          year: movie.Year,
          imdbID: movie.imdbID,
          poster: movie.Poster,
        }));
        setSuggestions(suggestions);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    setError(null);

    // Debounce suggestions
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && title.trim() !== "") {
      performSearch();
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setTitle(suggestion.title);
    setShowSuggestions(false);
    performSearch(suggestion.title);
  };

  return (
    <div className="search-container" ref={searchRef}>
      <div className="input-group">
        <input
          className="input search-input"
          placeholder="Search for movies..."
          value={title}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        <button
          className={`search-button ${isLoading ? "loading" : ""}`}
          onClick={() => performSearch()}
          disabled={title.trim() === "" || isLoading}
        >
          {isLoading ? (
            <div className="spinner"></div>
          ) : (
            <svg
              className="search-icon"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.imdbID}-${index}`}
              className="search-suggestion"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="suggestion-content">
                <div className="suggestion-title">{suggestion.title}</div>
                <div className="suggestion-year">{suggestion.year}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="search-error">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
          </svg>
          {error}
          <button className="search-error-close" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
