import pageController from "./page-controller.js";
import ratingByGameGenres from "./rating-by-game-genres.js";

pageController();

// Load data and run the visualization
const data = await d3.csv('./data.csv');

ratingByGameGenres(data);