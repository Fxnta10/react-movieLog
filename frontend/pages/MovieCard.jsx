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
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading movie details...</div>
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
            {error.message || "An error occurred"}
          </div>
        </div>
        <button className="error-close" onClick={() => setError(null)}>
          ×
        </button>
      </div>
    );
  }

  if (!movieData) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  return (
    <div className="movie-details fade-in">
      {/* Movie Hero Section */}
      <div className="movie-hero">
        <div className="movie-poster">
          <img
            src={
              movieData.Poster !== "N/A"
                ? movieData.Poster
                : "/placeholder-poster.png"
            }
            alt={movieData.Title}
            onError={(e) => {
              e.target.src = "/placeholder-poster.png";
            }}
          />
        </div>

        <div className="movie-info">
          <h1 className="movie-title">{movieData.Title}</h1>
          <div className="movie-subtitle">
            {movieData.Year} • {movieData.Rated} • {movieData.Runtime}
          </div>

          <div className="movie-meta-grid">
            <div className="movie-meta-item">
              <div className="movie-meta-label">IMDb Rating</div>
              <div className="movie-meta-value">
                {movieData.imdbRating || "N/A"}
              </div>
            </div>
            <div className="movie-meta-item">
              <div className="movie-meta-label">Director</div>
              <div className="movie-meta-value">{movieData.Director}</div>
            </div>
            <div className="movie-meta-item">
              <div className="movie-meta-label">Language</div>
              <div className="movie-meta-value">{movieData.Language}</div>
            </div>
            <div className="movie-meta-item">
              <div className="movie-meta-label">Released</div>
              <div className="movie-meta-value">{movieData.Released}</div>
            </div>
          </div>

          {movieData.Genre && (
            <div className="movie-genres">
              {movieData.Genre.split(", ").map((genre, index) => (
                <span key={index} className="movie-genre-tag">
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Plot */}
      {movieData.Plot && movieData.Plot !== "N/A" && (
        <div className="movie-plot">{movieData.Plot}</div>
      )}

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
          </svg>
          {error.message || "An error occurred"}
          <button
            className="btn btn-icon btn-sm"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Watch Status Section */}
      <div className="watch-status">
        <div
          className={`watch-status-card watchlist ${
            isInWatchlist ? "active" : ""
          }`}
          onClick={handleWatchlistAdd}
        >
          <div className="watch-status-icon"></div>
          <div className="watch-status-title">
            {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
          </div>
          <div className="watch-status-subtitle">
            {isInWatchlist
              ? "Remove from your watchlist"
              : "Save for later viewing"}
          </div>
        </div>

        <div
          className={`watch-status-card watching ${
            isCurrentlyWatching ? "active" : ""
          }`}
          onClick={handleCurrentlyWatchingAdd}
        >
          <div className="watch-status-icon"></div>
          <div className="watch-status-title">
            {isCurrentlyWatching ? "Currently Watching" : "Mark as Watching"}
          </div>
          <div className="watch-status-subtitle">
            {isCurrentlyWatching
              ? "Remove from currently watching"
              : "Track your viewing progress"}
          </div>
        </div>
      </div>

      {/* Review Section */}
      <div className="review-section">
        <div className="review-header">
          <h2 className="review-title">Your Review & Rating</h2>
          {!editReview && (
            <button
              className="btn btn-outline"
              onClick={() => setEditReview(true)}
            >
              <svg
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
              </svg>
              Edit Review
            </button>
          )}
        </div>

        {editReview ? (
          <>
            {/* Rating Input */}
            <div className="rating-input">
              <label className="rating-label">Your Rating:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={userRating}
                onChange={(e) => handleRatingChange(e.target.value)}
                className="rating-number"
                placeholder="1-10"
              />
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`rating-star ${
                      userRating >= star * 2 ? "filled" : ""
                    }`}
                    onClick={() => handleRatingChange(star * 2)}
                  ></span>
                ))}
              </div>
              {autoSaving && (
                <div className="text-sm text-secondary">
                  <div className="spinner"></div>
                  Auto-saving...
                </div>
              )}
            </div>

            {/* Like Button */}
            <div className="review-actions mb-lg">
              <button
                className={`like-button ${userLiked ? "liked" : ""}`}
                onClick={() => setUserLiked(!userLiked)}
              >
                <span>{userLiked ? "" : "♡"}</span>
                {userLiked ? "You liked this movie" : "Mark as liked"}
              </button>
            </div>

            {/* Review Textarea */}
            <textarea
              className="review-textarea"
              placeholder="Share your thoughts about this movie... What did you like or dislike? Would you recommend it?"
              value={userReview}
              onChange={(e) => setUserReview(e.target.value)}
              rows={6}
            />

            {/* Action Buttons */}
            <div className="review-actions">
              <button
                className="btn btn-primary"
                onClick={handleSaveReview}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="spinner"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z" />
                    </svg>
                    Save Review
                  </>
                )}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setEditReview(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Display Mode */}
            {userRating && (
              <div className="rating-display mb-lg">
                <span className="rating-label">Your Rating:</span>
                <span className="rating-value">{userRating}/10</span>
              </div>
            )}

            {/* Like Status */}
            <div className="like-status mb-lg">
              <button
                className={`like-button ${userLiked ? "liked" : ""}`}
                onClick={() => handleLikedToggle(!userLiked)}
              >
                <span>{userLiked ? "" : "♡"}</span>
                {userLiked ? "You liked this movie" : "Mark as liked"}
              </button>
            </div>

            {/* Review Display */}
            {userReview ? (
              <div className="review-display">
                <h3 className="text-lg font-weight-semibold mb-md">
                  Your Review:
                </h3>
                <p className="text-base text-secondary leading-relaxed">
                  {userReview}
                </p>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"></div>
                <div className="empty-state-title">No review yet</div>
                <div className="empty-state-subtitle">
                  Share your thoughts about this movie
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
