import pageController from "./page-controller.js";
import ratingByGameGenres from "./rating-by-game-genres.js";
import freePaidTotalGamesEvolution from "./free-paid-total-games-evolution.js";

pageController();

// Load data and run the visualization
const data = await d3.csv('./data.csv');

ratingByGameGenres(data);


freePaidTotalGamesEvolution(data);