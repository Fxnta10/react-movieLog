import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../src/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [currentlyWatching, setCurrentlyWatching] = useState([]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get("/api/me");
        setUserData(response.data);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch movies based on user data
  useEffect(() => {
    if (!userData) return;

    const fetchMovies = async (movieArray, setFunction, arrayName) => {
      if (!movieArray || movieArray.length === 0) {
        setFunction([]);
        return;
      }

      try {
        const movieIds = movieArray
          .slice(-10) // Get last 10 items
          .map((item) => item.movieID || item); // Support both object and ID format

        const moviePromises = movieIds.map(async (movieID) => {
          try {
            const response = await axios.get(`/api/card/${movieID}`);
            return { ...response.data, imdbID: movieID };
          } catch (err) {
            console.error(`Error fetching movie ${movieID}:`, err);
            return null;
          }
        });

        const responses = await Promise.all(moviePromises);
        const validMovies = responses.filter((movie) => movie !== null);
        setFunction(validMovies);
      } catch (err) {
        console.error(`Error fetching ${arrayName} movies:`, err);
        setError(err);
      }
    };

    // Fetch all movie lists
    fetchMovies(userData.watchList, setWatchlistMovies, "watchlist");
    fetchMovies(userData.watchedMovies, setWatchedMovies, "watched");
    fetchMovies(
      userData.currentlyWatching,
      setCurrentlyWatching,
      "currently watching"
    );
  }, [userData]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon"></div>
        <div className="error-content">
          <div className="error-title">Something went wrong</div>
          <div className="error-message">
            {error.message || "Failed to load dashboard"}
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!userData) return null;

  // Calculate statistics
  const totalWatched = userData?.watchedMovies?.length || 0;
  const totalWatchlist = userData?.watchList?.length || 0;
  const totalCurrentlyWatching = userData?.currentlyWatching?.length || 0;

  return (
    <div className="dashboard fade-in">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-welcome">
          Welcome back,{" "}
          {user?.username || user?.email?.split("@")[0] || "Movie Lover"}!
        </h1>
        <p className="dashboard-subtitle">
          Your personal movie tracking dashboard
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="dashboard-stats">
        <div className="stat-card watched">
          <div className="stat-header">
            <div className="stat-icon"></div>
            <div className="stat-number">{totalWatched}</div>
          </div>
          <div className="stat-label">Movies Watched</div>
          {totalWatched > 0 && (
            <div className="stat-change positive">
              <span></span>
              Keep watching!
            </div>
          )}
        </div>

        <div className="stat-card watchlist">
          <div className="stat-header">
            <div className="stat-icon"></div>
            <div className="stat-number">{totalWatchlist}</div>
          </div>
          <div className="stat-label">In Watchlist</div>
          {totalWatchlist > 0 && (
            <div className="stat-change">
              <span></span>
              Ready to watch
            </div>
          )}
        </div>

        <div className="stat-card currently-watching">
          <div className="stat-header">
            <div className="stat-icon"></div>
            <div className="stat-number">{totalCurrentlyWatching}</div>
          </div>
          <div className="stat-label">Currently Watching</div>
          {totalCurrentlyWatching > 0 && (
            <div className="stat-change">
              <span></span>
              In progress
            </div>
          )}
        </div>
      </div>

      {/* Currently Watching Section */}
      {currentlyWatching.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon watching"></div>
              Continue Watching
            </h2>
            <Link to="/watchlist" className="view-all-btn">
              View All
              <svg
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
                />
              </svg>
            </Link>
          </div>
          <div className="movie-list horizontal">
            {currentlyWatching.map((movie) => (
              <Link
                to={`/${movie.imdbID}`}
                key={movie.imdbID}
                className="movie-card compact hover-lift"
              >
                <div className="movie-card-image">
                  <img
                    src={
                      movie.Poster !== "N/A"
                        ? movie.Poster
                        : "/placeholder-poster.png"
                    }
                    alt={movie.Title}
                    onError={(e) => {
                      e.target.src = "/placeholder-poster.png";
                    }}
                  />
                  <div className="movie-card-overlay">
                    <div className="movie-card-rating">
                      {movie.imdbRating || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="movie-card-content">
                  <h3 className="movie-card-title">{movie.Title}</h3>
                  <div className="movie-card-meta">
                    <span className="movie-card-genre">{movie.Year}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Watchlist Section */}
      {watchlistMovies.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon watchlist"></div>
              Your Watchlist
            </h2>
            <Link to="/watchlist" className="view-all-btn">
              View All
              <svg
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
                />
              </svg>
            </Link>
          </div>
          <div className="movie-list horizontal">
            {watchlistMovies.map((movie) => (
              <Link
                to={`/${movie.imdbID}`}
                key={movie.imdbID}
                className="movie-card compact hover-lift"
              >
                <div className="movie-card-image">
                  <img
                    src={
                      movie.Poster !== "N/A"
                        ? movie.Poster
                        : "/placeholder-poster.png"
                    }
                    alt={movie.Title}
                    onError={(e) => {
                      e.target.src = "/placeholder-poster.png";
                    }}
                  />
                  <div className="movie-card-overlay">
                    <div className="movie-card-rating">
                      {movie.imdbRating || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="movie-card-content">
                  <h3 className="movie-card-title">{movie.Title}</h3>
                  <div className="movie-card-meta">
                    <span className="movie-card-genre">{movie.Year}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recently Watched Section */}
      {watchedMovies.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon watched"></div>
              Recently Watched
            </h2>
            <Link to="/watchlist" className="view-all-btn">
              View All
              <svg
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
                />
              </svg>
            </Link>
          </div>
          <div className="movie-list horizontal">
            {watchedMovies.map((movie) => (
              <Link
                to={`/${movie.imdbID}`}
                key={movie.imdbID || movie._id}
                className="movie-card compact hover-lift"
              >
                <div className="movie-card-image">
                  <img
                    src={
                      movie.Poster !== "N/A"
                        ? movie.Poster
                        : "/placeholder-poster.png"
                    }
                    alt={movie.Title}
                    onError={(e) => {
                      e.target.src = "/placeholder-poster.png";
                    }}
                  />
                  <div className="movie-card-overlay">
                    <div className="movie-card-rating">
                      {movie.imdbRating || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="movie-card-content">
                  <h3 className="movie-card-title">{movie.Title}</h3>
                  <div className="movie-card-meta">
                    <span className="movie-card-genre">{movie.Year}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalWatched === 0 &&
        totalWatchlist === 0 &&
        totalCurrentlyWatching === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"></div>
            <div className="empty-state-title">Welcome to MovieLog!</div>
            <div className="empty-state-subtitle">
              Start by searching for movies and building your watchlist
            </div>
            <Link to="/search" className="empty-state-action">
              <svg
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
              </svg>
              Discover Movies
            </Link>
          </div>
        )}
    </div>
  );
}
