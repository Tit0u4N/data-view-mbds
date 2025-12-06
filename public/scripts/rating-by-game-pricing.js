import {addFullscreenButton, CONTAINER_WIDTH, renderAtCorrectSize} from './utils/fullscreen-manager.js';

export default async (data) => {
    const containerId = 'rating-by-game-pricing';

    // Render function that accepts width and height
    const render = (containerWidth = CONTAINER_WIDTH, containerHeight = 400) => {

        // Process data first to determine dimensions
        const processedData = data.map(d => {
            const date = new Date(d.dateGlobal);
            const year = isNaN(date) ? null : date.getFullYear();
            const rating = +d.overallAvgRating;
            const category = d.category;
            return { year, rating, category };
        }).filter(d => d.year !== null && !isNaN(d.rating) && d.category);

        const nestedData = d3.nest()
            .key(d => d.category)
            .key(d => d.year)
            .rollup(v => ({
                avgRating: d3.mean(v, d => d.rating),
                count: v.length
            }))
            .entries(processedData);

        // Get unique Categories and Years for axes
        const categories = Array.from(new Set(processedData.map(d => d.category))).sort();
        const yearSet = Array.from(new Set(processedData.map(d => d.year))).sort((a, b) => a - b);

        // Fill missing years: create continuous range from min to max year
        const minYear = d3.min(yearSet);
        const maxYear = d3.max(yearSet);
        const years = [];
        for (let year = minYear; year <= maxYear; year++) {
            years.push(year);
        }

        // Create a map for quick lookup
        const dataMap = new Map();
        nestedData.forEach(cat => {
            cat.values.forEach(year => {
                dataMap.set(`${cat.key}:${year.key}`, year.value);
            });
        });

        // Generate full grid data including missing values
        const gridData = [];
        categories.forEach(cat => {
            years.forEach(year => {
                const data = dataMap.get(`${cat}:${year}`);
                gridData.push({
                    category: cat,
                    year: year,
                    rating: data ? data.avgRating : undefined,
                    count: data ? data.count : 0
                });
            });
        });

        // Define dimension and SVG container
        const margin = { top: 80, right: 50, bottom: 130, left: 100 };
        const width = containerWidth - margin.left - margin.right;

        // Adjust height to make cells more square-like
        const cellWidth = width / years.length;
        const calculatedHeight = (cellWidth * categories.length) + 50;
        const height = Math.min(calculatedHeight, containerHeight - margin.top - margin.bottom);

        const svg = d3.select(`#${containerId}`)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .html(""); // Clear previous content

        // Add title
        svg.append("text")
            .text("Heatmap des notes moyennes par catégorie et année")
            .attr("x", (width + margin.left + margin.right) / 2)
            .attr("y", 20)
            .attr("font-size", "18px")
            .attr("font-weight", "bold")
            .attr("text-anchor", "middle");

        const container = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scaleBand()
            .range([0, width])
            .domain(years)
            .padding(0.05);

        const y = d3.scaleBand()
            .range([height, 0])
            .domain(categories)
            .padding(0.05);

        const myColor = d3.scaleLinear()
            .domain([1, 5 * 0.50, 5 * 0.80, 5])
            .range(["white", "yellow", "darkred", "black"]);

        // Axes
        container.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x)) // Show all years
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        container.append("g")
            .call(d3.axisLeft(y));

        // Tooltip
        const tooltip = d3.select("body").append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style('z-index', 900000000)
            .style('pointer-events', 'none')
            .style('padding', '10px 12px')
            .style('background', 'rgba(0,0,0,0.9)')
            .style('color', '#fff')
            .style('font-size', '14px')
            .style('font-family', 'sans-serif')
            .style('border-radius', '6px')
            .style('box-shadow', '0 2px 8px rgba(0,0,0,0.3)');

        const mouseover = function (d) {
            tooltip.style("opacity", 1);
            d3.select(this).style("stroke", "black").style("opacity", 1);
        }
        const mousemove = function (d) {
            const ratingText = d.rating !== undefined ? d.rating.toFixed(2) : "Pas de donnée";
            const countText = d.count > 0 ? `${d.count} jeux` : "0 jeux";
            tooltip
                .html(`<strong>Année:</strong> ${d.year}<br><strong>Catégorie:</strong> ${d.category}<br><strong>Note Moyenne:</strong> ${ratingText}<br><strong>Nombre de jeux:</strong> ${countText}`)
                .style("left", (d3.event.pageX + 15) + "px")
                .style("top", (d3.event.pageY - 15) + "px");
        }
        const mouseleave = function (d) {
            tooltip.style("opacity", 0);
            d3.select(this).style("stroke", "none").style("opacity", 0.8);
        }

        // Draw Heatmap
        container.selectAll()
            .data(gridData, function (d) { return d.category + ':' + d.year; })
            .enter()
            .append("rect")
            .attr("x", function (d) { return x(d.year) })
            .attr("y", function (d) { return y(d.category) })
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", function (d) { return d.rating !== undefined ? myColor(d.rating) : "#d3d3d3" }) // Gray if no data
            .style("stroke-width", 4)
            .style("stroke", "none")
            .style("opacity", 0.8)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);

        // Add text counts if range is small (<= 15 years)
        if (years.length <= 25) {
            container.selectAll(".count-label")
                .data(gridData)
                .enter()
                .append("text")
                .attr("class", "count-label")
                .attr("x", d => x(d.year) + x.bandwidth() / 2)
                .attr("y", d => y(d.category) + y.bandwidth() / 2)
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .text(d => d.count > 0 ? d.count : "")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .style("fill", d => {
                    if (d.rating === undefined) return "#555"; // Gray cell -> dark gray text
                    return d.rating > 3.5 ? "white" : "black"; // Dark cell -> white text, Light cell -> black text
                })
                .style("pointer-events", "none");
        }

        // Legend - Optimized layout (aligned left, compact)
        const legendWidth = 300;
        const legendHeight = 25;
        const legendSpacing = 80; // Reduced from 100 to bring legend closer to heatmap

        // Legend aligned to the left with label on the same line
        const legend = container.append("g")
            .attr("transform", `translate(0, ${height + legendSpacing})`);

        // Add "Note moyenne" label on the same line as gradient
        legend.append("text")
            .attr("x", 10)
            .attr("y", legendHeight / 2)
            .text("Note moyenne :")
            .style("font-size", "14px")
            .style("alignment-baseline", "middle");

        const labelWidth = 120; // Space for the label
        const gradientGroup = legend.append("g")
            .attr("transform", `translate(${labelWidth}, 0)`);

        const defs = container.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient");

        linearGradient
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        linearGradient.selectAll("stop")
            .data([
                { offset: "0%", color: "white" },
                { offset: "50%", color: "yellow" },
                { offset: "80%", color: "darkred" },
                { offset: "100%", color: "black" }
            ])
            .enter().append("stop")
            .attr("offset", function (d) { return d.offset; })
            .attr("stop-color", function (d) { return d.color; });

        gradientGroup.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#linear-gradient)");

        const legendScale = d3.scaleLinear()
            .domain([1, 5])
            .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale).ticks(5);

        gradientGroup.append("g")
            .attr("transform", `translate(0, ${legendHeight})`)
            .call(legendAxis);

        // "No Data" Legend Item - positioned after gradient
        const noDataGroup = legend.append("g")
            .attr("transform", `translate(${labelWidth + legendWidth + 20}, 0)`);

        noDataGroup.append("text")
            .attr("x", 0)
            .attr("y", legendHeight / 2)
            .text("Pas de donnée :")
            .style("font-size", "14px")
            .style("alignment-baseline", "middle");

        noDataGroup.append("rect")
            .attr("width", legendHeight)
            .attr("height", legendHeight)
            .attr('x', 105)
            .style("fill", "#d3d3d3")
            .style("stroke", "#ccc");


        // Labels
        container.append("text")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + 60) // Reduced from 60 to bring closer
            .text("Année")
            .style("font-size", "14px")
            .style("font-weight", "600");

        container.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -75) // Reduced from -120 to bring closer to heatmap
            .attr("x", -height / 2)
            .text("Catégorie")
            .style("font-size", "14px")
            .style("font-weight", "600");
    };

    // Initial render
    renderAtCorrectSize(containerId, render)

    // Add fullscreen button
    addFullscreenButton(containerId, render);
}