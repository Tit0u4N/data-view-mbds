import { getColor } from "./utils/color-manager.js";
import makeLegends  from "./utils/make-lengends.js";

export default function pricingGameYear(data) {
    // Dimensions
    const margin = { top: 100, right: 200, bottom: 80, left: 80 }; // Increased margins
    const width = 1000 - margin.left - margin.right; // Increased width
    const height = 600 - margin.top - margin.bottom; // Increased height

    // Container (div wrapper)
    const container = d3.select("#pricing-game-year");

    // Clear previous content
    container.selectAll("*").remove();

    // Add Title
    container.append("h3")
        .text("Evolution du prix moyen des jeux par année")
        .style("text-align", "center")
        .style("font-family", "Roboto, sans-serif")
        .style("color", "#2c3e50")
        .style("margin-bottom", "20px");



    // Create SVG Container for the chart
    const svgContainer = container.append("div")
        .style("display", "flex")
        .style("justify-content", "center");

    // Create SVG with proper dimensions
    const mainSvg = svgContainer.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    // Create main group with transform
    const svg = mainSvg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 1. Process Data
    const getYear = (d) => {
        if (!d.dateGlobal) return null;
        const date = new Date(d.dateGlobal);
        return isNaN(date) ? null : date.getFullYear();
    };

    // Filter valid data
    const validData = data.filter(d => {
        const year = getYear(d);
        const price = +d.amount;
        return year !== null && d.category && !isNaN(price) && price > 0; // Exclude free games
    });

    const nestedMap = new Map();
    validData.forEach(d => {
        const year = getYear(d);
        const genre = d.category;
        const key = `${year}-${genre}`;
        if (!nestedMap.has(key)) {
            nestedMap.set(key, { year, genre, prices: [], count: 0 });
        }
        const entry = nestedMap.get(key);
        entry.prices.push(+d.amount);
        entry.count += 1;
    });

    // Calculate aggregates
    const aggregatedData = Array.from(nestedMap.values()).map(group => ({
        year: group.year,
        date: new Date(group.year, 0, 1), // Create Date object for time scale
        genre: group.genre,
        avgPrice: d3.mean(group.prices),
        count: group.count
    }));

    // 2. Scales
    const dates = aggregatedData.map(d => d.date);
    const xExtent = d3.extent(dates);
    // Add padding: subtract 6 months from min, add 6 months to max
    const xDomain = [d3.timeMonth.offset(xExtent[0], -6), d3.timeMonth.offset(xExtent[1], 6)];

    const yMax = d3.max(aggregatedData, d => d.avgPrice) * 1.1;
    const yDomain = [0, yMax];

    // Main Chart Scales
    const x = d3.scaleTime().domain(xDomain).range([0, width]); // scaleTime
    const y = d3.scaleLinear().domain(yDomain).range([height, 0]);

    // Navigation Scale for Price (Horizontal)
    const navYScale = d3.scaleLinear().domain(yDomain).range([0, width]); // Price mapped horizontally

    const r = d3.scaleSqrt()
        .domain([0, d3.max(aggregatedData, d => d.count)])
        .range([4, 30]); // Larger bubbles

    const genres = Array.from(new Set(aggregatedData.map(d => d.genre))).sort();

    // Use shared color manager
    const color = (category) => getColor(category);

    // 3. Clip Path
    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    // 4. Draw Bubbles
    const scatter = svg.append("g")
        .attr("clip-path", "url(#clip)");

    const bubbles = scatter.selectAll("circle")
        .data(aggregatedData)
        .enter().append("circle")
        .attr("cx", d => x(d.date)) // Use date
        .attr("cy", d => y(d.avgPrice))
        .attr("r", d => r(d.count))
        .style("fill", d => color(d.genre))
        .style("opacity", 0.7)
        .style("stroke", "black")
        .on("mouseover", function (d) {
            d3.select(this).style("stroke", "black").style("stroke-width", 2).style("opacity", 1);
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`Genre: ${d.genre}<br/>Year: ${d.year}<br/>Avg Price: ${d.avgPrice.toFixed(2)}<br/>Count: ${d.count}`)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function (d) {
            d3.select(this).style("stroke", "black").style("stroke-width", 1).style("opacity", 0.7);
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // 5. Axes
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)); // Default time formatting

    const yAxis = svg.append("g")
        .call(d3.axisLeft(y));

    // Labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Année");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 20)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Prix Moyen (€/$)");

    // 6. Price Slider
    let priceSelection = [0, width];

    const brushHeight = 50; // Larger brush area
    const brushGroup = svg.append("g")
        .attr("transform", `translate(0, -${margin.top - 20})`);

    // Add label for price slider
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top + 10)
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-family", "Roboto, sans-serif")
        .style("fill", "#555")
        .text("Filtre de prix");

    // Brush Background Track
    brushGroup.append("rect")
        .attr("width", width)
        .attr("height", brushHeight)
        .attr("fill", "#ffefb0ff")
        .attr("rx", 8) // Rounded corners
        .attr("ry", 8);

    // Brush Axis Group
    const brushAxisGroup = brushGroup.append("g")
        .attr("transform", `translate(0, ${brushHeight - 20})`); // Position axis inside/bottom of track

    // Initialize Brush
    const brush = d3.brushX()
        .extent([[0, 0], [width, brushHeight]])
        .on("brush end", brushed);

    const brushNode = brushGroup.append("g")
        .attr("class", "brush")
        .call(brush);

    // Style the selection rect (modern look)
    brushNode.select(".selection")
        .attr("fill", "#ffb861ff")
        .attr("fill-opacity", 0.5)
        .attr("stroke", "#ff7d32ff")
        .attr("stroke-width", 1)
        .attr("rx", 4)
        .attr("ry", 4);

    // Custom Handles (Arrows)
    // Define arrow paths (Clean modern arrows)
    const leftArrow = "M 8,0 L 0,10 L 8,20"; // Simple chevron pointing left
    const rightArrow = "M 0,0 L 8,10 L 0,20"; // Simple chevron pointing right

    const handleGroup = brushNode.selectAll(".handle--custom")
        .data([{ type: "w" }, { type: "e" }])
        .enter().append("g")
        .attr("class", "handle--custom")
        .style("cursor", "ew-resize");

    // Handle Circle Background
    handleGroup.append("circle")
        .attr("r", 15)
        .attr("fill", "white")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 1)
        .style("filter", "drop-shadow(0px 2px 2px rgba(0,0,0,0.1))");

    // Handle Arrow Icon
    handleGroup.append("path")
        .attr("d", d => d.type === "w" ? leftArrow : rightArrow)
        .attr("fill", "none")
        .attr("stroke", "#ff7700")
        .attr("stroke-width", 2)
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .attr("transform", "translate(-4, -10)"); // Center the path in the circle

    // Initial Render
    updateBrushAxis();
    brushNode.call(brush.move, priceSelection);

    function updateBrushAxis() {
        brushAxisGroup.selectAll("*").remove();
        brushAxisGroup.call(d3.axisBottom(navYScale).ticks(10).tickSize(0).tickPadding(10));
        brushAxisGroup.select(".domain").remove();
        brushAxisGroup.selectAll("text").style("fill", "#777").style("font-family", "Roboto, sans-serif");
    }

    function brushed() {
        if (!d3.event.selection) return;

        const selection = d3.event.selection;
        updateHandles(selection);

        // Store selection
        priceSelection = selection;

        updateChart();
    }

    function updateHandles(selection) {
        handleGroup.attr("transform", (d, i) => {
            const x = selection[i];
            const yOffset = brushHeight / 2;
            return `translate(${x}, ${yOffset})`;
        });
    }

    function updateChart() {
        // Calculate Price Domain from slider
        const yMin = navYScale.invert(priceSelection[0]);
        const yMax = navYScale.invert(priceSelection[1]);

        // Update Y Scale (price axis)
        y.domain([yMin, yMax]);

        // Update Y Axis
        yAxis.call(d3.axisLeft(y));

        // Update Bubbles
        bubbles
            .attr("cy", d => y(d.avgPrice))
            .style("display", d => {
                const inY = d.avgPrice >= yMin && d.avgPrice <= yMax;
                return inY ? "block" : "none";
            });
    }

    // Legend
    makeLegends(svg, genres, width, color);

    // Tooltip
    let tooltip = d3.select("body").selectAll(".tooltip-pricing").data([0]);
    tooltip = tooltip.enter().append("div")
        .attr("class", "tooltip-pricing")
        .style("position", "absolute")
        .style("text-align", "center")
        .style("padding", "12px") // Larger padding
        .style("font", "14px Roboto, sans-serif") // Modern font
        .style("background", "rgba(255, 255, 255, 0.95)") // Glassmorphism-ish
        .style("border", "1px solid #eee")
        .style("border-radius", "12px")
        .style("box-shadow", "0 4px 12px rgba(0,0,0,0.1)") // Soft shadow
        .style("pointer-events", "none")
        .style("opacity", 0)
        .merge(tooltip);
}
