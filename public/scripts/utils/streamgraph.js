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
    title = "Some Streamgraph",
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

    // Add Title
    svg.append("g")
        .attr("transform", `translate(${width / 2},${marginTop / 2})`)
        .append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text(title);

    // Return the chart with the color scale as a property (for the legend).
    return Object.assign(svg.node(), { scales: { color: colorScale } });
}