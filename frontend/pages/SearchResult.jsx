import React from "react";
import { useLocation, useParams } from "react-router-dom";

export default function SearchResult() {
  const location = useLocation();
  const { title } = useParams();

  const searchResults = location.state || [];

  if (!searchResults || searchResults.length === 0) {
    return (
      <>
        <h2>No Search Results Found for "{decodeURIComponent(title)}"</h2>
        <p>Please try a different search term or go back to the home page.</p>
      </>
    );
  }

  const resultTiles = searchResults.map((movie) => {
    const posterSrc =
      movie.Poster && movie.Poster !== "N/A"
        ? movie.Poster
        : "https://via.placeholder.com/300x450.png?text=No+Poster+Available";

    return (
      <div key={movie.imdbID} className="movie-tile">
        <img src={posterSrc} alt={movie.Title} />
        <h4>{movie.Title}</h4>
        <p>Year: {movie.Year}</p>
      </div>
    );
  });

  return (
    <>
      <h2>Search Results for "{decodeURIComponent(title)}"</h2>
      <div className="search-results-container">{resultTiles}</div>
    </>
  );
}
