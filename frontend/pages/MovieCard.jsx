import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function MovieCard() {
  const { imdbID } = useParams();
  const [movieData, setMovieData] = useState(null);
  const [userReview, setUserReview] = useState("");
  const [userRating, setUserRating] = useState("");
  const [userLiked, setUserLiked] = useState(false);
  const [editReview, setEditReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [error, setError] = useState(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);

  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isCurrentlyWatching, setIsCurrentlyWatching] = useState(false);

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/movie/${imdbID}`);
        setMovieData(response.data.movie);

        // Set watchlist status
        setIsInWatchlist(response.data.inWatchlist || false);
        setIsCurrentlyWatching(response.data.isCurrentlyWatching || false);

        const { review, rating, liked } = response.data.user;
        if (review) {
          setUserReview(review);
          setEditReview(false);
        } else {
          setEditReview(true);
        }

        setUserRating(rating || "");
        setUserLiked(liked || false);
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (imdbID) {
      fetchMovieData();
    }
  }, [imdbID]);

  const handleSaveReview = async () => {
    try {
      setSaving(true);
      const response = await axios.post(`/api/movie/${imdbID}/review`, {
        review: userReview,
        rating: userRating ? parseInt(userRating) : null,
        liked: userLiked,
      });

      if (response.data.success) {
        setEditReview(false);
        // Update local state with saved data
        const { review, rating, liked } = response.data.data;
        setUserReview(review || "");
        setUserRating(rating || "");
        setUserLiked(liked || false);
      }
    } catch (err) {
      console.error("Error saving review:", err);
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleLikedToggle = async (newLikedStatus) => {
    try {
      // Optimistically update UI
      setUserLiked(newLikedStatus);

      const response = await axios.patch(`/api/movie/${imdbID}/liked`, {
        liked: newLikedStatus,
      });

      if (!response.data.success) {
        // Revert on failure
        setUserLiked(!newLikedStatus);
        setError(new Error("Failed to update liked status"));
      }
    } catch (err) {
      console.error("Error updating liked status:", err);
      // Revert on error
      setUserLiked(!newLikedStatus);
      setError(err);
    }
  };

  // Auto-save rating after user stops typing for 2 seconds
  const handleRatingChange = (newRating) => {
    setUserRating(newRating);

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new timeout for auto-save
    const timeoutId = setTimeout(async () => {
      if (newRating && newRating !== "") {
        try {
          setAutoSaving(true);
          await axios.post(`/api/movie/${imdbID}/review`, {
            rating: parseInt(newRating),
          });
          console.log("Rating auto-saved");
        } catch (err) {
          console.error("Auto-save rating failed:", err);
          setError(err);
        } finally {
          setAutoSaving(false);
        }
      }
    }, 2000); // 2 second delay

    setAutoSaveTimeout(timeoutId);
  };

  const handleWatchlistAdd = async () => {
    try {
      await axios.post(`/api/movie/${imdbID}/addWatchlist`, {
        changeTo: !isInWatchlist,
      });
      setIsInWatchlist(!isInWatchlist);
      console.log(`Changed Watchlist condition of ${imdbID}`);
    } catch (err) {
      console.error(err);
      setError(err);
    }
  };
  const handleCurrentlyWatchingAdd = async () => {
    try {
      await axios.post(`/api/movie/${imdbID}/addCurrentlyWatching`, {
        changeTo: !isCurrentlyWatching,
      });
      setIsCurrentlyWatching(!isCurrentlyWatching);
      console.log(`Changed Currently watching  condition of ${imdbID}`);
    } catch (err) {
      console.error(err);
      setError(err);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
        <p style={{ color: "red" }}>Error: {error.message}</p>
        <button onClick={() => setError(null)}>Try Again</button>
      </div>
    );
  }

  if (!movieData) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      <div className="movie-details">
        <h2>{movieData.Title}</h2>
        <p>Year: {movieData.Year}</p>
        <img src={movieData.Poster} alt={movieData.Title} />
        <p>{movieData.Genre}</p>
        <p>{movieData.Released}</p>
        <p>{movieData.Runtime}</p>
        <p>{movieData.Director}</p>
        <p>{movieData.Language}</p>
        <p>{movieData.Plot}</p>
        <p>IMDb Rating: {movieData.imdbRating}</p>

        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <h3>Your Review & Rating</h3>

          {error && (
            <div
              style={{
                backgroundColor: "#fee",
                border: "1px solid #fcc",
                padding: "0.5rem",
                borderRadius: "4px",
                marginBottom: "1rem",
                color: "#d00",
              }}
            >
              {error.message || "An error occurred"}
              <button
                onClick={() => setError(null)}
                style={{ marginLeft: "1rem", fontSize: "12px" }}
              >
                ✕
              </button>
            </div>
          )}

          <div className="watch-type">
            <span
              onClick={handleWatchlistAdd}
              className={isInWatchlist ? "selected" : "not-selected"}
            >
              {isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            </span>
            <span
              onClick={handleCurrentlyWatchingAdd}
              className={isCurrentlyWatching ? "selected" : "not-selected"}
            >
              {isCurrentlyWatching
                ? "Remove from currently watching"
                : "Add to currently watching"}
            </span>
          </div>

          {editReview ? (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label>Your Rating (1-10): </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={userRating}
                  onChange={(e) => handleRatingChange(e.target.value)}
                  style={{ marginLeft: "0.5rem", width: "60px" }}
                />
                <small style={{ marginLeft: "0.5rem", color: "#666" }}>
                  {autoSaving ? "Saving..." : "(Auto-saves after 2 seconds)"}
                </small>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label>
                  <input
                    type="checkbox"
                    checked={userLiked}
                    onChange={(e) => setUserLiked(e.target.checked)}
                  />
                  <span style={{ marginLeft: "0.5rem" }}>
                    I liked this movie
                  </span>
                </label>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <textarea
                  placeholder="Write your review here..."
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  rows={4}
                  style={{ width: "100%", padding: "0.5rem" }}
                />
              </div>

              <button
                onClick={handleSaveReview}
                disabled={saving}
                style={{ marginRight: "0.5rem" }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditReview(false)}>Cancel</button>
            </>
          ) : (
            <>
              {userRating && (
                <p>
                  <strong>Your Rating:</strong> {userRating}/10
                </p>
              )}

              <div style={{ marginBottom: "1rem" }}>
                <label>
                  <input
                    type="checkbox"
                    checked={userLiked}
                    onChange={(e) => handleLikedToggle(e.target.checked)}
                  />
                  <span style={{ marginLeft: "0.5rem" }}>
                    {userLiked ? "❤️ You liked this movie" : "♡ Mark as liked"}
                  </span>
                </label>
              </div>

              {userReview && (
                <p>
                  <strong>Your Review:</strong> {userReview}
                </p>
              )}
              <button onClick={() => setEditReview(true)}>Edit Review</button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
