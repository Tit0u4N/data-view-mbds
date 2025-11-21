import ratingByGamePricing from "./rating-by-game-pricing.js";
import dateSlider from "./date-slider.js";
import freePaidTotalGamesEvolution from "./free-paid-total-games-evolution.js";

// Load data and run the visualization
const data = await d3.csv('./data.csv');

// Initial render
ratingByGamePricing(data);
freePaidTotalGamesEvolution(data);

// State
let lastDateFilteredData = data;
let currentPricing = 'all';
let selectedCategories = new Set();

// Extract unique categories and clean them
const categories = Array.from(new Set(data.map(d => {
    // Clean the category string (remove quotes, brackets, etc.)
    let category = d.category;
    if (category) {
        category = category.replace(/[\[\]'"]/g, '').trim();
    }
    return category;
}))).filter(cat => cat && cat.length > 0).sort();

categories.forEach(cat => selectedCategories.add(cat)); // Default: all selected

// Initialize Category Multiselect
const checkboxesContainer = document.getElementById("checkboxes");
categories.forEach(cat => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${cat}" checked /> ${cat}`;
    checkboxesContainer.appendChild(label);

    // Add event listener
    label.querySelector("input").addEventListener("change", (e) => {
        if (e.target.checked) {
            selectedCategories.add(cat);
        } else {
            selectedCategories.delete(cat);
        }
        updateVisualization();
    });
});

// Toggle Checkboxes visibility
let expanded = false;
const toggleCheckboxes = () => {
    const checkboxes = document.getElementById("checkboxes");
    if (!expanded) {
        checkboxes.style.display = "block";
        expanded = true;
    } else {
        checkboxes.style.display = "none";
        expanded = false;
    }
};

// Attach click handler to selectBox
document.getElementById("selectBox").addEventListener("click", toggleCheckboxes);

// Close checkboxes when clicking outside
document.addEventListener('click', (e) => {
    const multiselect = document.getElementById('category-multiselect');
    if (!multiselect.contains(e.target)) {
        document.getElementById("checkboxes").style.display = "none";
        expanded = false;
    }
});

// Function to apply all filters
const applyFilters = (dataToFilter) => {
    return dataToFilter.filter(d => {
        // Pricing Filter
        let pricingMatch = true;
        if (currentPricing !== 'all') {
            const isFree = d.isFree === 'TRUE';
            if (currentPricing === 'free' && !isFree) pricingMatch = false;
            if (currentPricing === 'paid' && isFree) pricingMatch = false;
        }

        // Category Filter - clean the category value before checking
        let cleanCategory = d.category;
        if (cleanCategory) {
            cleanCategory = cleanCategory.replace(/[\[\]'"]/g, '').trim();
        }
        const categoryMatch = selectedCategories.has(cleanCategory);

        return pricingMatch && categoryMatch;
    });
};

const updateVisualization = () => {
    const finalData = applyFilters(lastDateFilteredData);
    ratingByGamePricing(finalData);
    freePaidTotalGamesEvolution(finalData);
};

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