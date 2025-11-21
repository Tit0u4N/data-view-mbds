export default (data, onUpdate) => {
    const container = d3.select("#date-slider");
    container.html(""); // Clear previous

    // Parse years
    const years = data.map(d => {
        const date = new Date(d.dateGlobal);
        return isNaN(date) ? null : date.getFullYear();
    }).filter(y => y !== null);

    const minYear = d3.min(years);
    const maxYear = d3.max(years);

    // Dimensions
    const margin = { top: 20, right: 30, bottom: 30, left: 30 };
    const width = 800 - margin.left - margin.right;
    const height = 60 - margin.top - margin.bottom;
    const trackHeight = 6;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("role", "slider")
        .attr("aria-label", "Sélecteur de plage de dates")
        .attr("aria-valuemin", minYear)
        .attr("aria-valuemax", maxYear)
        .style("overflow", "visible")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([minYear, maxYear])
        .range([0, width]);

    // 1. Visual Track (Background)
    svg.append("rect")
        .attr("class", "slider-track-bg")
        .attr("x", 0)
        .attr("y", height / 2 - trackHeight / 2)
        .attr("width", width)
        .attr("height", trackHeight)
        .attr("rx", trackHeight / 2)
        .attr("fill", "#e9ecef");

    // 2. Visual Selection (Foreground Track)
    const visualSelection = svg.append("rect")
        .attr("class", "slider-track-fill")
        .attr("y", height / 2 - trackHeight / 2)
        .attr("height", trackHeight)
        .attr("rx", trackHeight / 2)
        .attr("fill", "#222")
        .attr("pointer-events", "none");

    // 3. Axis (Below)
    svg.append("g")
        .attr("transform", `translate(0,${height / 2 + 20})`)
        .call(d3.axisBottom(x).ticks(10, "d").tickSize(0).tickPadding(10))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll("text").attr("fill", "#999").style("font-weight", "500").style("font-family", "system-ui"));

    // 4. Brush (Invisible Interaction Layer)
    const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .handleSize(30) // Large hit area for handles
        .on("brush end", brushed);

    const gBrush = svg.append("g")
        .attr("class", "brush")
        .call(brush);

    // Hide default brush styling
    gBrush.select(".selection").style("fill", "none").style("stroke", "none");
    gBrush.select(".overlay").style("fill", "none"); // Keep pointer events
    gBrush.selectAll(".handle").style("fill", "none").style("stroke", "none"); // Invisible handles

    // 5. Custom Handles (Visuals)
    const handleGroup = svg.append("g")
        .attr("pointer-events", "none");

    const handles = handleGroup.selectAll(".handle-circle")
        .data([{ type: "w" }, { type: "e" }])
        .enter().append("circle")
        .attr("class", "handle-circle")
        .attr("r", 10)
        .attr("fill", "white")
        .attr("stroke", "#222")
        .attr("stroke-width", 2.5)
        .attr("cy", height / 2)
        .style("filter", "drop-shadow(0 2px 3px rgba(0,0,0,0.2))");

    // Default selection: all
    gBrush.call(brush.move, [0, width]);

    function brushed() {
        const selection = d3.event.selection;
        if (!selection) return;

        const [start, end] = selection; // pixels

        // Update Visual Selection
        visualSelection
            .attr("x", start)
            .attr("width", end - start);

        // Update Visual Handles
        handles
            .attr("cx", d => d.type === "w" ? start : end);

        // Logic
        const [startYear, endYear] = [start, end].map(x.invert).map(Math.round);

        // Update Label
        d3.select("#date-range-label")
            .style("font-family", "system-ui, sans-serif")
            .style("color", "#333")
            .style("font-size", "14px")
            .html(`<span style="color: #666; margin-right: 8px; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Période</span> <span style="font-size: 16px; font-weight: 600;">${startYear}</span> <span style="color: #ccc; margin: 0 5px;">—</span> <span style="font-size: 16px; font-weight: 600;">${endYear}</span>`);

        // Filter data
        if (d3.event.type === "end" || d3.event.type === "brush") {
            const filteredData = data.filter(d => {
                const date = new Date(d.dateGlobal);
                if (isNaN(date)) return false;
                const year = date.getFullYear();
                return year >= startYear && year <= endYear;
            });
            onUpdate(filteredData);
        }
    }
}
