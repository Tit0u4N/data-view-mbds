import dateSlider from "./utils/date-slider.js";
import { filterData } from "./utils/data-manager.js";
import { initCategoryMultiselect } from "./utils/category-multiselect.js";
import ratingByGamePricing from "./rating-by-game-pricing.js";
import freePaidTotalGamesEvolution from "./free-paid-total-games-evolution.js";
import pricingGameYear from "./pricing-game-year.js";

// Load data and run the visualizationr
const data = await d3.csv('./data.csv');

// Initial render
ratingByGamePricing(data);
freePaidTotalGamesEvolution(data);
pricingGameYear(data);

// State
let lastDateFilteredData = data;
let currentPricing = 'all';
let selectedCategories = new Set();

const updateVisualization = () => {
    const filters = {
        pricing: currentPricing,
        selectedCategories: selectedCategories
    };

    // Note: lastDateFilteredData is already filtered by date from the slider
    // We apply the other filters on top of it
    const finalData = filterData(lastDateFilteredData, filters);

    ratingByGamePricing(finalData);
    freePaidTotalGamesEvolution(finalData);
    pricingGameYear(finalData);
};

// FILTERS

initCategoryMultiselect(data, selectedCategories, updateVisualization);

// Initialize Slider
dateSlider(data, (filteredData) => {
    lastDateFilteredData = filteredData;
    updateVisualization();
});

// Initialize Pricing Filter
const pricingSelect = document.getElementById('pricing-filter');
pricingSelect.addEventListener('change', (e) => {
    currentPricing = e.target.value;
    updateVisualization();
});