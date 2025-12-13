import { getColor } from "./utils/color-manager.js";
import {addFullscreenButton, CONTAINER_WIDTH, renderAtCorrectSize} from './utils/fullscreen-manager.js';

let savedData = null;

export default function pricingGameYear(data) {
    const containerId = 'pricing-game-year';
    savedData = data;

    // Render function that accepts width and height
    const render = (data = savedData, containerWidth = CONTAINER_WIDTH, containerHeight = 500) => {
        // Save new data for fullscreen toggles
        savedData = data;
        // Dimensions
        const margin = { top: 100, right: 40, bottom: 80, left: 40 };
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;

        // Container (div wrapper)
        const container = d3.select(`#${containerId}`);

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
            .attr("width", width + 20)
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
                tooltip.html(`<strong>Genre:</strong> ${d.genre}<br/><strong>Année:</strong> ${d.year}<br/><strong>Prix moyenne:</strong> ${d.avgPrice.toFixed(2)}<br/><strong>Nombre:</strong> ${d.count}`)
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
            .style("font-weight", "600")
            .text("Année");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .text("Prix Moyen (€/$)");

        // 6. Price Slider
        let priceSelection = [0, width];

        const brushHeight = 60; // Height matching date slider
        const trackHeight = 6; // Thin track like date slider
        const brushGroup = svg.append("g")
            .attr("transform", `translate(0, -${margin.top - 20})`);

        // Add label for price slider
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top + 10)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-family", "system-ui")
            .style("font-weight", "500")
            .style("fill", "#555")
            .text("Filtre de prix");

        // 1. Visual Track (Background) - same as date slider
        brushGroup.append("rect")
            .attr("class", "slider-track-bg")
            .attr("x", 0)
            .attr("y", brushHeight / 2 - trackHeight / 2)
            .attr("width", width)
            .attr("height", trackHeight)
            .attr("rx", trackHeight / 2)
            .attr("fill", "#e9ecef");

        // 2. Visual Selection (Foreground Track) - same as date slider
        const visualSelection = brushGroup.append("rect")
            .attr("class", "slider-track-fill")
            .attr("y", brushHeight / 2 - trackHeight / 2)
            .attr("height", trackHeight)
            .attr("rx", trackHeight / 2)
            .attr("fill", "#222")
            .attr("pointer-events", "none");

        // 3. Axis (Below) - same style as date slider
        const brushAxisGroup = brushGroup.append("g")
            .attr("transform", `translate(0, ${brushHeight / 2 + 20})`)
            .call(d3.axisBottom(navYScale).ticks(10).tickSize(0).tickPadding(10))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text").attr("fill", "#999").style("font-weight", "500").style("font-family", "system-ui"));

        // 4. Initialize Brush (Invisible Interaction Layer)
        const brush = d3.brushX()
            .extent([[0, 0], [width, brushHeight]])
            .handleSize(30)
            .on("brush end", brushed);

        const brushNode = brushGroup.append("g")
            .attr("class", "brush")
            .call(brush);

        // Hide default brush styling - same as date slider
        brushNode.select(".selection").style("fill", "none").style("stroke", "none");
        brushNode.select(".overlay").style("fill", "none");
        brushNode.selectAll(".handle").style("fill", "none").style("stroke", "none");

        // 5. Custom Handles (Visuals) - same as date slider
        const handleGroup = brushGroup.append("g")
            .attr("pointer-events", "none");

        const handles = handleGroup.selectAll(".handle-circle")
            .data([{ type: "w" }, { type: "e" }])
            .enter().append("circle")
            .attr("class", "handle-circle")
            .attr("r", 10)
            .attr("fill", "white")
            .attr("stroke", "#222")
            .attr("stroke-width", 2.5)
            .attr("cy", brushHeight / 2)
            .style("filter", "drop-shadow(0 2px 3px rgba(0,0,0,0.2))");

        // Initial Render
        brushNode.call(brush.move, priceSelection);

        function brushed() {
            if (!d3.event.selection) return;

            const selection = d3.event.selection;

            // Update Visual Selection
            visualSelection
                .attr("x", selection[0])
                .attr("width", selection[1] - selection[0]);

            // Update Visual Handles
            handles.attr("cx", d => d.type === "w" ? selection[0] : selection[1]);

            // Store selection
            priceSelection = selection;

            updateChart();
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

        // Tooltip
        let tooltip = d3.select("body").selectAll(".tooltip-pricing").data([0]);
        tooltip = tooltip.enter().append("div")
            .attr("class", "tooltip-pricing")
            .style("position", "absolute")
            .style('pointer-events', 'none')
            .style('z-index', 900000000)
            .style('padding', '10px 12px')
            .style('background', 'rgba(0,0,0,0.9)')
            .style('color', '#fff')
            .style('font-size', '14px')
            .style('font-family', 'sans-serif')
            .style('border-radius', '6px')
            .style('box-shadow', '0 2px 8px rgba(0,0,0,0.3)')
            .style('max-width', '300px')
            .style("opacity", 0)
            .merge(tooltip);
    };

    // Function to render with saved data at correct size
    const renderFn = (newData) => renderAtCorrectSize(containerId, render, newData);

    // Initial render
    renderFn(data);

    // Add fullscreen button - with a slight delay to ensure DOM is ready
    setTimeout(() => addFullscreenButton(containerId, () => renderFn(savedData)), 100);

    // Return a function that can be called to re-render with new data
    return renderFn;
}
