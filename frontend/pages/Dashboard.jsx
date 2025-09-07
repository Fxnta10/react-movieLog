import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [currentlyWatching, setCurrentlyWatching] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/me");
        // The API now returns the user object directly.
        setUserData(response.data);
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (!userData) return;

    const fetchMovies = async (movieArray, setFunction) => {
      // Ensure the array is not null or empty
      if (!movieArray || movieArray.length === 0) {
        setFunction([]);
        return;
      }

      try {
        const last10Ids = movieArray
          .slice(-10)
          .map((item) => item.movieID || item); // Handle both plain IDs and objects

        const moviePromises = last10Ids.map((movieID) =>
          axios.get(`/card/${movieID}`)
        );

        const responses = await Promise.all(moviePromises);
        // The API now returns the movie object directly.
        const moviesData = responses.map((res) => res.data);
        setFunction(moviesData);
      } catch (err) {
        console.error("Error fetching movies:", err);
        setError(err);
      }
    };

    fetchMovies(userData.watchList, setWatchlistMovies);
    fetchMovies(userData.watchedMovies, setWatchedMovies);
    fetchMovies(userData.currentlyWatching, setCurrentlyWatching);
  }, [userData]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error occurred: {error.message}</div>;

  // Render nothing or a loading state if userData is null
  if (!userData) return null;

  return (
    <main>
      <div className="dashboard-watchlist">
        <h3>Watchlist</h3>
        {watchlistMovies.map((movie) => (
          <Link to={`/${movie.imdbID}`} key={movie.imdbID}>
            <div className="movie-tile">
              <img src={movie.Poster} alt={movie.Title} />
              <h4>{movie.Title}</h4>
              <p>Year: {movie.Year}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="recently-watching">
        <h3>Recently Watched</h3>
        {watchedMovies.map((movie) => (
          <Link to={`/${movie.imdbID}`} key={movie.imdbID}>
            <div className="movie-tile">
              <img src={movie.Poster} alt={movie.Title} />
              <h4>{movie.Title}</h4>
              <p>Year: {movie.Year}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="currently-watching">
        <h3>Currently Watching</h3>
        {currentlyWatching.map((movie) => (
          <Link to={`/${movie.imdbID}`} key={movie.imdbID}>
            <div className="movie-tile">
              <img src={movie.Poster} alt={movie.Title} />
              <h4>{movie.Title}</h4>
              <p>Year: {movie.Year}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="user-details">
        <h2>Here is your profile Overview</h2>
        {/* Use optional chaining to prevent errors if the arrays are null or undefined */}
        <div>Total Movies Watched: {userData.watchedMovies?.length || 0}</div>
        <div>Total Movies in Watchlist: {userData.watchList?.length || 0}</div>
        <div>User since: 24th March 2024</div>
      </div>
    </main>
  );
}
