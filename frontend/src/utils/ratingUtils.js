export function backendRatingToStars(rating) {
  return rating ? rating / 2 : 0;
}

export function starsToBackendRating(stars) {
  return Math.round(stars * 2);
}
