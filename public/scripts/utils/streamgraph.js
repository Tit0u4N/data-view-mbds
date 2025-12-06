// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/streamgraph
// This code is modified version of it, to fit our data and needs.

export default function Streamgraph(data, keys, {
    width = 928,
    height = 500,
    marginTop = 40,
    marginRight = 10,
    marginBottom = 60,
    marginLeft = 60,
    xKey = "year",
    xLabel = "Year",
    yLabel = "Number of games",
    color = d3.scaleOrdinal(d3.schemeTableau10)

}) {

    // Stack the data.
    const series = d3.stack()
        .keys(keys)
        .order(d3.stackOrderInsideOut)
        .offset(d3.stackOffsetWiggle)
        (data);

    // Prepare the scales for positional and color encodings.
    const x = d3.scaleUtc()
        .domain(d3.extent(data, d => d[xKey]))
        .range([marginLeft, width - marginRight]);


    const y = d3.scaleLinear()
        .domain(d3.extent(series.flat(2)))
        .rangeRound([height - marginBottom, marginTop]);

    // If color is a function (like from ColorManager), wrap it or use it directly.
    // But here we expect a d3 scale or a function that takes a key and returns a color.
    const colorScale = typeof color === 'function' ? color : d3.scaleOrdinal().domain(series.map(d => d.key)).range(d3.schemeTableau10);

    // Construct an area shape.
    const area = d3.area()
        .x(d => x(d.data[xKey]))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .attr("style", "max-width: 100%; height: auto;");

    // Add the y-axis, remove the domain line, add grid lines and a label.
    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y).ticks(height / 80).tickFormat((d) => Math.abs(d).toLocaleString("en-US")))
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))

    // Append the x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        // show all years
        .call(d3.axisBottom(x).ticks(d3.timeYear.every(1)).tickFormat(d3.timeFormat("%Y")))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height)
        .text(xLabel)
        .style("font-size", "14px")
        .style("font-weight", "600");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", 10)
        .attr("x", -height / 2)
        .text(yLabel)
        .style("font-size", "14px")
        .style("font-weight", "600");


    // Append a path for each series.
    svg.append("g")
        .selectAll()
        .data(series)
        .join("path")
        .attr("fill", d => colorScale(d.key))
        .attr("d", area)
        .append("title")
        .text(d => d.key);


    // Append a vertical line (initially hidden)
    const hoverLine = svg.append("line")
        .attr("class", "hover-line")
        .attr("stroke", "#939393")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 4")
        .style("display", "none");

    // Create a tooltip div if it doesn't exist
    // Tooltip
    let tooltip = d3.select("body").selectAll(".tooltip-number-evo").data([0]);
    tooltip = tooltip.enter().append("div")
        .attr("class", "tooltip-number-evo")
        .style("position", "absolute")
        .style('pointer-events', 'none')
        .style('padding', '10px 12px')
        .style('background', 'rgba(0,0,0,0.9)')
        .style('color', '#fff')
        .style('z-index', 900000000)
        .style('font-size', '14px')
        .style('font-family', 'sans-serif')
        .style('border-radius', '6px')
        .style('box-shadow', '0 2px 8px rgba(0,0,0,0.3)')
        .style('max-width', '300px')
        .style("opacity", 0)
        .merge(tooltip);

    // Add a transparent overlay to capture mouse events
    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mousemove", function () {
            const [mx] = d3.mouse(this);
            const cursorDate = x.invert(mx);
            const cursorYear = d3.timeYear.round(cursorDate);
            const nearest = closestDate(cursorYear, data, xKey);
            const xPos = x(nearest.date);

            hoverLine
                .style("display", null)
                .attr("x1", xPos)
                .attr("x2", xPos)

                .attr("y1", marginTop)
                .attr("y2", height - marginBottom);

            let tooltipContent = `<strong>Année:</strong> ${d3.timeFormat("%Y")(nearest.date)}<br/>`;
            keys.forEach(key => {
                const value = nearest.data[key] || 0;
                if(value!==0)
                    tooltipContent += `<span style="color:${colorScale(key)};">&#9679;</span> <strong>${key}:</strong> ${value.toLocaleString("en-US")}<br/>`;
            });

            tooltip
                .html(tooltipContent)
                .style("left", (d3.event.pageX + 15) + "px")
                .style("top", (d3.event.pageY - 15) + "px")
                .transition().duration(200).style("opacity", 1);
        })
        .on("mouseleave", function () {
            hoverLine.style("display", "none");
            tooltip.transition().duration(200).style("opacity", 0);
        });

    // Return the chart with the color scale as a property (for the legend).
    return Object.assign(svg.node(), { scales: { color: colorScale } });
}


function closestDate(targetDate, data, xKey) {
    let closest = null;
    let minDiff = Infinity;

    data.forEach(d => {
        const currentDate = d[xKey];
        const diff = Math.abs(currentDate - targetDate);

        if (diff < minDiff) {
            minDiff = diff;
            closest = d;
        }
    });

    return { date: closest[xKey], data: closest };
}