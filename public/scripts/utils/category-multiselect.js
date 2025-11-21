import { extractCategories } from "./data-manager.js";
import { getColor } from "./color-manager.js";

export const initCategoryMultiselect = (data, selectedCategories, updateVisualization) => {
    const categories = extractCategories(data);

    categories.forEach(cat => selectedCategories.add(cat)); // Default: all selected

// Initialize Category Multiselect
    const checkboxesContainer = document.getElementById("checkboxes");
    categories.forEach(cat => {
        const label = document.createElement("label");
        const color = getColor(cat);

        // Create color indicator
        const colorIndicator = `<span class="color-indicator" style="background-color: ${color};"></span>`;

        label.innerHTML = `<input type="checkbox" value="${cat}" checked /> ${colorIndicator} ${cat}`;
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
}

