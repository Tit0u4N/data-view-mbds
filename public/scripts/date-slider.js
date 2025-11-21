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

    // Get input elements
    const startYearInput = document.getElementById('start-year-input');
    const endYearInput = document.getElementById('end-year-input');

    // Set initial values and limits for inputs
    startYearInput.min = minYear;
    startYearInput.max = maxYear;
    startYearInput.value = minYear;
    endYearInput.min = minYear;
    endYearInput.max = maxYear;
    endYearInput.value = maxYear;

    // Track if update is from input to avoid infinite loop
    let isUpdatingFromInput = false;

    // Function to update data based on year range
    function updateData(startYear, endYear) {
        // Filter data
        const filteredData = data.filter(d => {
            const date = new Date(d.dateGlobal);
            if (isNaN(date)) return false;
            const year = date.getFullYear();
            return year >= startYear && year <= endYear;
        });

        // Fill missing years with placeholder data
        const fillMissingYears = (data, startYear, endYear) => {
            const yearSet = new Set();
            data.forEach(d => {
                const date = new Date(d.dateGlobal);
                if (!isNaN(date)) {
                    yearSet.add(date.getFullYear());
                }
            });

            const filledData = [...data];
            for (let year = startYear; year <= endYear; year++) {
                if (!yearSet.has(year)) {
                    // Add a placeholder entry for missing year
                    filledData.push({
                        dateGlobal: `01/01/${year} 00:00`,
                        overallAvgRating: null,
                        isFree: null,
                        category: null,
                        id: `placeholder-${year}`,
                        _isFilled: true // Marker to identify filled data
                    });
                }
            }

            return filledData.sort((a, b) => {
                const dateA = new Date(a.dateGlobal);
                const dateB = new Date(b.dateGlobal);
                return dateA - dateB;
            });
        };

        const dataWithAllYears = fillMissingYears(filteredData, startYear, endYear);
        onUpdate(dataWithAllYears);
    }

    // 4. Brush (Invisible Interaction Layer)
    const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .handleSize(30) // Large hit area for handles
        .on("brush end", function () {
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

            // Update inputs only if not updating from inputs
            if (!isUpdatingFromInput) {
                startYearInput.value = startYear;
                endYearInput.value = endYear;
            }

            // Update data only on brush end to avoid too many updates
            if (d3.event.type === "end") {
                updateData(startYear, endYear);
            }
        });

    const gBrush = svg.append("g")
        .attr("class", "brush")
        .call(brush);

    // Hide default brush styling
    gBrush.select(".selection").style("fill", "none").style("stroke", "none");
    gBrush.select(".overlay").style("fill", "none"); // Keep pointer events
    gBrush.selectAll(".handle").style("fill", "none").style("stroke", "none"); // Invisible handles

    // Default selection: all
    gBrush.call(brush.move, [0, width]);

    // Update slider when inputs change
    function updateSliderFromInputs() {
        const startYear = parseInt(startYearInput.value);
        const endYear = parseInt(endYearInput.value);

        // Validate
        if (isNaN(startYear) || isNaN(endYear)) return;
        if (startYear < minYear || startYear > maxYear) return;
        if (endYear < minYear || endYear > maxYear) return;
        if (startYear > endYear) {
            // Auto-correct: if start > end, swap them
            const temp = startYearInput.value;
            startYearInput.value = endYearInput.value;
            endYearInput.value = temp;
            return;
        }

        // Convert years to pixel positions
        const startPos = x(startYear);
        const endPos = x(endYear);

        // Update the brush
        isUpdatingFromInput = true;
        gBrush.call(brush.move, [startPos, endPos]);

        // Update visuals
        visualSelection
            .attr("x", startPos)
            .attr("width", endPos - startPos);
        handles
            .attr("cx", d => d.type === "w" ? startPos : endPos);

        // Update data
        updateData(startYear, endYear);

        isUpdatingFromInput = false;
    }

    // Add event listeners to inputs
    startYearInput.addEventListener('change', updateSliderFromInputs);
    endYearInput.addEventListener('change', updateSliderFromInputs);
}
