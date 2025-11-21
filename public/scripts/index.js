import ratingByGamePricing from "./rating-by-game-pricing.js";
import dateSlider from "./date-slider.js";
import freePaidTotalGamesEvolution from "./free-paid-total-games-evolution.js";
import pricingGameYear from "./pricing-game-year.js";

// Load data and run the visualization
// Load data and run the visualization
const rawData = await d3.text('./data.csv');

// Function to clean the weird CSV format
const cleanData = (raw) => {
    return raw.split('\n').map(line => {
        // Remove BOM if present
        if (line.charCodeAt(0) === 0xFEFF) {
            line = line.slice(1);
        }
        line = line.trim();
        if (!line) return null;

        // Remove trailing ;;
        line = line.replace(/;;$/, '');

        // Remove outer quotes if the entire line is quoted
        if (line.startsWith('"') && line.endsWith('"')) {
            line = line.slice(1, -1);
        }

        // Unescape double quotes ("" -> ")
        line = line.replace(/""/g, '"');

        return line;
    }).filter(l => l).join('\n');
};

const cleanedData = cleanData(rawData);
const data = d3.csvParse(cleanedData);

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
    pricingGameYear(finalData)
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