const CATEGORY_COLORS = {
    "Action": "#a6cee3",
    "Adventure": "#1f78b4",
    "Role-playing": "#b2df8a",
    "Racing": "#33a02c",
    "Shooter": "#fb9a99",
    "Simulation": "#e31a1c",
    "Sports": "#fdbf6f",
    "Strategy": "#ff7f00"
};

const DEFAULT_COLOR = "#808080";

export const getColor = (category) => {
    if (!category) return DEFAULT_COLOR;
    // Clean category name just in case, though data should be cleaned before
    const cleanCat = category.replace(/[\[\]'"]/g, '').trim();
    return CATEGORY_COLORS[cleanCat] || DEFAULT_COLOR;
};

export const getAllColors = () => {
    return CATEGORY_COLORS;
};
