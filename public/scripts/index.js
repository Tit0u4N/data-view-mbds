import pageController from "./page-controller.js";
import ratingByGameGenres from "./rating-by-game-genres.js";
import pricingGameYear from "./pricing-game-year.js";

pageController();

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

ratingByGameGenres(data);
pricingGameYear(data);