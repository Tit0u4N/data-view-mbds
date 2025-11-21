export default async (data) => {

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
    const years = Array.from(new Set(processedData.map(d => d.year))).sort((a, b) => a - b);

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
    const margin = { top: 50, right: 150, bottom: 100, left: 150 };
    const width = 1250 - margin.left - margin.right;

    // Adjust height to make cells more square-like
    const cellWidth = width / years.length;
    const height = (cellWidth * categories.length) + 50;

    const svg = d3.select('#scene')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .html("") // Clear previous content
        .append("g")
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
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => !(i % 2)))) // Show every 2nd year to avoid clutter
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    svg.append("g")
        .call(d3.axisLeft(y));

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", "absolute");

    const mouseover = function (d) {
        tooltip.style("opacity", 1);
        d3.select(this).style("stroke", "black").style("opacity", 1);
    }
    const mousemove = function (d) {
        const ratingText = d.rating !== undefined ? d.rating.toFixed(2) : "Pas de donnée";
        const countText = d.count > 0 ? `${d.count} jeux` : "0 jeux";
        tooltip
            .html(`Année: ${d.year}<br>Catégorie: ${d.category}<br>Note Moyenne: ${ratingText}<br>Nombre de jeux: ${countText}`)
            .style("left", (d3.event.pageX + 15) + "px")
            .style("top", (d3.event.pageY - 15) + "px");
    }
    const mouseleave = function (d) {
        tooltip.style("opacity", 0);
        d3.select(this).style("stroke", "none").style("opacity", 0.8);
    }

    // Draw Heatmap
    svg.selectAll()
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
    if (years.length <= 15) {
        svg.selectAll(".count-label")
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

    // Legend
    const legendHeight = height;
    const legendWidth = 20;

    const legend = svg.append("g")
        .attr("transform", `translate(${width + 40}, 0)`);

    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient");

    linearGradient
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
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

    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#linear-gradient)");

    const legendScale = d3.scaleLinear()
        .domain([1, 5])
        .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale);

    legend.append("g")
        .attr("transform", `translate(${legendWidth}, 0)`)
        .call(legendAxis);

    // "No Data" Legend Item
    const noDataGroup = legend.append("g")
        .attr("transform", `translate(0, ${legendHeight + 30})`);

    noDataGroup.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendWidth)
        .style("fill", "#d3d3d3")
        .style("stroke", "#ccc");

    noDataGroup.append("text")
        .attr("x", legendWidth + 10)
        .attr("y", 15)
        .text("Pas de donnée")
        .style("font-size", "12px")
        .style("alignment-baseline", "middle");

    // Labels
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width / 2)
        .attr("y", height + 60)
        .text("Année");

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -120)
        .attr("x", -height / 2)
        .text("Catégorie");
}