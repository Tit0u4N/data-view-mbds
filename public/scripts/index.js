import pageController from "./page-controller.js";
import ratingByGamePricing from "./rating-by-game-pricing.js";

pageController();

// Load data and run the visualization
const data = await d3.csv('./data.csv');

ratingByGamePricing(data);