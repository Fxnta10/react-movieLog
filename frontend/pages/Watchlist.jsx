import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../src/hooks/useAuth";

export default function Watchlist() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [movieIds, setMovieIds] = useState([]);
  const [movies, setMovies] = useState([]);
  const [removing, setRemoving] = useState({}); // map imdbID -> boolean

  // Fetch user data (watchList IDs)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get("/api/me");
        // backend /api/me seems to return raw user object
        const ids = res.data?.watchList || [];
        setMovieIds(ids);
      } catch (err) {
        console.error("Failed to load user watchlist", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Fetch movie details for each ID
  useEffect(() => {
    if (!movieIds || movieIds.length === 0) {
      setMovies([]);
      return;
    }

    let cancelled = false;
    const fetchMovies = async () => {
      try {
        const promises = movieIds.map(async (id) => {
          try {
            const res = await axios.get(`/api/card/${id}`);
            return { ...res.data, imdbID: id };
          } catch (err) {
            console.warn("Error fetching movie", id, err.message);
            return null;
          }
        });
        const data = await Promise.all(promises);
        if (!cancelled) {
          setMovies(data.filter(Boolean));
        }
      } catch (err) {
        if (!cancelled) setError(err);
      }
    };

    fetchMovies();
    return () => {
      cancelled = true;
    };
  }, [movieIds]);

  const removeFromWatchlist = async (imdbID) => {
    setRemoving((prev) => ({ ...prev, [imdbID]: true }));
    try {
      // API expects changeTo false to remove
      await axios.post(`/api/movie/${imdbID}/addWatchlist`, {
        changeTo: false,
      });
      // Optimistic update: remove from local state
      setMovies((prev) => prev.filter((m) => m.imdbID !== imdbID));
      setMovieIds((prev) => prev.filter((id) => id !== imdbID));
    } catch (err) {
      console.error("Failed to remove from watchlist", err);
      setError(err);
    } finally {
      setRemoving((prev) => ({ ...prev, [imdbID]: false }));
    }
  };

  if (loading) {
    return (
      <div className="search-loading">
        <div className="search-loading-spinner" />
        <div>Loading your watchlist...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-empty">
        <div className="search-empty-icon">⚠️</div>
        <div className="search-empty-title">Error loading watchlist</div>
        <div className="search-empty-subtitle">
          {error.message || "Something went wrong."}
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="search-page">
        <div className="search-header">
          <h1 className="search-title">Your Watchlist</h1>
          <p className="search-subtitle">
            You haven’t added any movies yet. Find something to watch and save
            it here.
          </p>
        </div>
        <div className="search-empty">
          <div className="search-empty-icon">📌</div>
          <div className="search-empty-title">Nothing saved</div>
          <div className="search-empty-subtitle">
            Browse or search for movies and add them to your watchlist.
          </div>
          <Link
            to="/search"
            className="btn btn-primary"
            style={{ marginTop: "1rem" }}
          >
            Discover Movies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="search-page">
      <div className="search-header">
        <h1 className="search-title">Your Watchlist</h1>
        <p className="search-subtitle">
          {movies.length} {movies.length === 1 ? "movie" : "movies"} saved
          {user?.username ? ` for ${user.username}` : ""}
        </p>
      </div>
      <section className="search-results">
        <div className="search-results-header">
          <div>
            <div className="search-results-title">Saved Movies</div>
            <div className="search-results-count">{movies.length} total</div>
          </div>
        </div>
        <div className="search-results-grid">
          {movies.map((movie) => {
            const posterSrc =
              movie.Poster && movie.Poster !== "N/A"
                ? movie.Poster
                : "/placeholder-poster.png";
            const imdbID = movie.imdbID;
            const isRemoving = removing[imdbID];
            return (
              <div key={imdbID} className="movie-card">
                <div className="movie-card-image">
                  <img
                    src={posterSrc}
                    alt={movie.Title}
                    loading="lazy"
                    onError={(e) =>
                      (e.currentTarget.src = "/placeholder-poster.png")
                    }
                  />
                  <div className="movie-card-year">{movie.Year}</div>
                  <div className="movie-card-rating">WL</div>
                </div>
                <div className="movie-card-content">
                  <h3 className="movie-card-title">{movie.Title}</h3>
                  <div className="movie-card-meta">
                    <span className="movie-card-genre">
                      {movie.Type || "Movie"}
                    </span>
                  </div>
                  <div className="movie-card-actions">
                    <Link
                      to={`/${imdbID}`}
                      className="movie-card-action"
                      style={{ textDecoration: "none" }}
                    >
                      Details
                    </Link>
                    <button
                      className={`movie-card-action ${
                        isRemoving ? "active" : ""
                      }`}
                      disabled={isRemoving}
                      onClick={() => removeFromWatchlist(imdbID)}
                    >
                      {isRemoving ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
