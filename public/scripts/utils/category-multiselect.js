import { extractCategories } from "./data-manager.js";
import { getColor } from "./color-manager.js";

export const initCategoryMultiselect = (data, selectedCategories, updateVisualization) => {
    const categories = extractCategories(data);

    categories.forEach(cat => selectedCategories.add(cat)); // Default: all selected

    // Initialize Category Badges
    const badgesContainer = document.getElementById("category-badges-container");

    categories.forEach(cat => {
        const badge = document.createElement("span");
        badge.className = "category-badge active";
        badge.dataset.category = cat;

        const color = getColor(cat);

        // Create colored dot
        const dot = document.createElement("span");
        dot.className = "category-dot";
        dot.style.backgroundColor = color;

        // Create text element
        const text = document.createElement("span");
        text.textContent = cat;

        // Append dot and text to badge
        badge.appendChild(dot);
        badge.appendChild(text);

        // Add click event listener
        badge.addEventListener("click", () => {
            if (badge.classList.contains("active")) {
                badge.classList.remove("active");
                selectedCategories.delete(cat);
            } else {
                badge.classList.add("active");
                selectedCategories.add(cat);
            }
            updateVisualization();
        });

        badgesContainer.appendChild(badge);
    });
}

