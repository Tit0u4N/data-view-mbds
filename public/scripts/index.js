import pageController from "./page-controller.js";
import ratingByGamePricing from "./rating-by-game-pricing.js";
import dateSlider from "./date-slider.js";
import freePaidTotalGamesEvolution from "./free-paid-total-games-evolution.js";

pageController();

// Load data and run the visualization
const data = await d3.csv('./data.csv');

// Initial render
ratingByGamePricing(data);
freePaidTotalGamesEvolution(data);

// Initialize Slider
dateSlider(data, (filteredData) => {
    // Re-render active view with filtered data
    // Currently only one view is implemented, so we just call it.
    // In a real app, we would check which view is active.
    ratingByGamePricing(filteredData);
    freePaidTotalGamesEvolution(data);
});