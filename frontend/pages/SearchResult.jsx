import React from "react";
import { useLocation, useParams, Link } from "react-router-dom";

export default function SearchResult() {
  const location = useLocation();
  const { title } = useParams();

  const results = Array.isArray(location.state) ? location.state : [];
  const decodedTitle = title ? decodeURIComponent(title) : "";

  if (!results || results.length === 0) {
    return (
      <div className="search-page">
        <div className="search-header">
          <h1 className="search-title">No results for “{decodedTitle}”</h1>
          <p className="search-subtitle">
            Try a different title, check your spelling, or explore trending
            movies.
          </p>
        </div>

        <div className="search-empty">
          <div className="search-empty-icon">🔍</div>
          <div className="search-empty-title">We couldn’t find anything</div>
          <div className="search-empty-subtitle">
            Use the search bar above to look for another movie title.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-page">
      {/* Header */}
      <div className="search-header">
        <h1 className="search-title">Results for “{decodedTitle}”</h1>
        <p className="search-subtitle">
          Found {results.length} {results.length === 1 ? "movie" : "movies"}
        </p>
      </div>

      {/* Results */}
      <section className="search-results">
        <div className="search-results-header">
          <div>
            <div className="search-results-title">Search Results</div>
            <div className="search-results-count">{results.length} total</div>
          </div>
        </div>

        <div className="search-results-grid">
          {results.map((movie) => {
            const posterSrc =
              movie.Poster && movie.Poster !== "N/A"
                ? movie.Poster
                : "/placeholder-poster.png";

            return (
              <Link
                to={`/${movie.imdbID}`}
                key={movie.imdbID}
                className="movie-card hover-lift"
              >
                <div className="movie-card-image">
                  <img
                    src={posterSrc}
                    alt={movie.Title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-poster.png";
                    }}
                  />
                  <div className="movie-card-overlay"></div>
                  <div className="movie-card-year">{movie.Year}</div>
                </div>
                <div className="movie-card-content">
                  <h3 className="movie-card-title">{movie.Title}</h3>
                  <div className="movie-card-meta">
                    <span className="movie-card-genre">
                      {movie.Type || "Movie"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
