import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const [title, setTitle] = React.useState("");
  const [error, setError] = React.useState(null);

  const navigate = useNavigate();

  const performSearch = async () => {
    try {
      setError(null); // Clear previous errors
      const response = await axios.get(
        `/api/search?title=${encodeURIComponent(title)}`
      );

      if (!response.data.success) {
        setError(response.data.error || "Something went wrong with the search.");
        return;
      }

      // Navigate to search results page with the data
      navigate(`/search/${encodeURIComponent(title)}`, {
        state: response.data.data, // Pass the movies array
      });
    } catch (err) {
      console.error("Error during search:", err);
      setError("An error occurred. Please try again later.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && title.trim() !== "") {
      performSearch();
    }
  };

  return (
    <div>
      <input
        placeholder="Search for movies..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button 
        onClick={performSearch}
        disabled={title.trim() === ""}
      >
        Search
      </button>
      {error ? <p style={{ color: "red" }}>{error}</p> : null}
    </div>
  );
}
