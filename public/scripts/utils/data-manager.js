export const cleanCategory = (category) => {
    if (!category) return "";
    return category.replace(/[\[\]'"]/g, '').trim();
};

export const extractCategories = (data) => {
    const categories = new Set();
    data.forEach(d => {
        const cat = cleanCategory(d.category);
        if (cat && cat.length > 0) {
            categories.add(cat);
        }
    });
    return Array.from(categories).sort();
};

export const filterData = (data, filters) => {
    const { pricing, selectedCategories, dateRange } = filters;

    return data.filter(d => {
        // Pricing Filter
        let pricingMatch = true;
        if (pricing && pricing !== 'all') {
            const isFree = d.isFree === 'TRUE';
            if (pricing === 'free' && !isFree) pricingMatch = false;
            if (pricing === 'paid' && isFree) pricingMatch = false;
        }

        // Category Filter
        let categoryMatch = true;
        if (selectedCategories) {
            const cat = cleanCategory(d.category);
            categoryMatch = selectedCategories.has(cat);
        }

        // Date Filter (if dateRange is provided and data has dateGlobal)
        let dateMatch = true;
        if (dateRange && d.dateGlobal) {
            const date = new Date(d.dateGlobal);
            if (!isNaN(date)) {
                const year = date.getFullYear();
                if (year < dateRange[0] || year > dateRange[1]) {
                    dateMatch = false;
                }
            }
        }

        return pricingMatch && categoryMatch && dateMatch;
    });
};
