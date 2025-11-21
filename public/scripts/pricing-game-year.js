
export default function pricingGameYear(data) {
    // Dimensions
    const margin = { top: 100, right: 200, bottom: 80, left: 80 }; // Increased margins
    const width = 1000 - margin.left - margin.right; // Increased width
    const height = 600 - margin.top - margin.bottom; // Increased height

    // Container
    const container = d3.select("#data-view-2");

    // Clear previous content
    container.selectAll("*").remove();

    // Add Title
    container.append("h3")
        .text("Evolution du prix moyen des jeux par année")
        .style("text-align", "center")
        .style("font-family", "Roboto, sans-serif")
        .style("color", "#2c3e50")
        .style("margin-bottom", "20px");

    // Add Controls Container
    const controls = container.append("div")
        .style("display", "flex")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("margin-bottom", "10px");

    controls.append("label")
        .text("Zoomer sur : ")
        .style("margin-right", "10px")
        .style("font-family", "Roboto, sans-serif")
        .style("font-size", "16px"); // Larger font

    const dropdown = controls.append("select")
        .style("padding", "8px")
        .style("font-size", "16px") // Larger font
        .style("border-radius", "4px")
        .style("border", "1px solid #ccc");

    dropdown.append("option").text("Année").attr("value", "year");
    dropdown.append("option").text("Prix").attr("value", "price");

    // Append SVG
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
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

    // Group by Year and Genre
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

    // Navigation Scales (Horizontal for both)
    const navXScale = d3.scaleTime().domain(xDomain).range([0, width]); // scaleTime
    const navYScale = d3.scaleLinear().domain(yDomain).range([0, width]); // Price mapped horizontally

    const r = d3.scaleSqrt()
        .domain([0, d3.max(aggregatedData, d => d.count)])
        .range([4, 30]); // Larger bubbles

    const genres = Array.from(new Set(aggregatedData.map(d => d.genre))).sort();
    const color = d3.scaleOrdinal()
        .domain(genres)
        .range([
            "#ffa4d5ff",
            "#FF0000",
            "#FFD700",
            "#32CD32",
            "#FF8C00",
            "#1E90FF",
            "#9400D3",
            "#00CED1"
        ]);

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

    // 6. Dynamic Brush
    let currentMode = "year"; // 'year' or 'price'
    let yearSelection = [0, width];
    let priceSelection = [0, width];

    const brushHeight = 50; // Larger brush area
    const brushGroup = svg.append("g")
        .attr("transform", `translate(0, -${margin.top - 20})`);

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
    brushNode.call(brush.move, yearSelection);

    // Dropdown Listener
    dropdown.on("change", function () {
        currentMode = this.value;
        updateBrushAxis();

        // Switch selection to the stored one for the new mode
        const targetSelection = currentMode === "year" ? yearSelection : priceSelection;

        // Temporarily disable listener to avoid double update loop
        brush.on("brush end", null);
        brushNode.call(brush.move, targetSelection);
        brush.on("brush end", brushed);

        // Update handles position manually since we disabled the listener
        updateHandles(targetSelection);
    });

    function updateBrushAxis() {
        brushAxisGroup.selectAll("*").remove();
        if (currentMode === "year") {
            brushAxisGroup.call(d3.axisBottom(navXScale).ticks(width / 80).tickSize(0).tickPadding(10));
            brushAxisGroup.select(".domain").remove(); // Remove axis line for cleaner look
        } else {
            brushAxisGroup.call(d3.axisBottom(navYScale).ticks(10).tickSize(0).tickPadding(10));
            brushAxisGroup.select(".domain").remove();
        }
        brushAxisGroup.selectAll("text").style("fill", "#777").style("font-family", "Roboto, sans-serif");
    }

    function brushed() {
        if (!d3.event.selection) return;

        const selection = d3.event.selection;
        updateHandles(selection);

        // Store selection
        if (currentMode === "year") {
            yearSelection = selection;
        } else {
            priceSelection = selection;
        }

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
        // 1. Calculate Year Domain (Date objects)
        const xMin = navXScale.invert(yearSelection[0]);
        const xMax = navXScale.invert(yearSelection[1]);

        // 2. Calculate Price Domain
        const yMin = navYScale.invert(priceSelection[0]);
        const yMax = navYScale.invert(priceSelection[1]);

        // 3. Update Main Scales
        x.domain([xMin, xMax]);
        y.domain([yMin, yMax]);

        // 4. Update Axes
        xAxis.call(d3.axisBottom(x)); // Default time formatting
        yAxis.call(d3.axisLeft(y));

        // 5. Update Bubbles
        bubbles
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.avgPrice))
            .style("display", d => {
                const inX = d.date >= xMin && d.date <= xMax;
                const inY = d.avgPrice >= yMin && d.avgPrice <= yMax;
                return (inX && inY) ? "block" : "none";
            });
    }

    // Legend
    const legend = svg.selectAll(".legend")
        .data(genres)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0,${i * 40})`); // Increased spacing (40px)

    legend.append("rect")
        .attr("x", width + 30)
        .attr("width", 20)
        .attr("height", 20)
        .attr("rx", 6) // Rounded corners
        .attr("ry", 6)
        .style("fill", color);

    legend.append("text")
        .attr("x", width + 60)
        .attr("y", 10)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .style("font-size", "16px") // Larger font
        .style("font-family", "Roboto, sans-serif")
        .style("fill", "#555") // Softer color
        .text(d => d);

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
