const CATEGORY_COLORS = {
    "Action": "#e6194b",
    "Adventure": "#3cb44b",
    "Casual": "#ffe119",
    "Indie": "#4363d8",
    "Massively Multiplayer": "#f58231",
    "RPG": "#911eb4",
    "Racing": "#46f0f0",
    "Simulation": "#f032e6",
    "Sports": "#bcf60c",
    "Strategy": "#fabebe",
    "Free to Play": "#008080",
    "Early Access": "#e6beff",
    "Other": "#9a6324"
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
