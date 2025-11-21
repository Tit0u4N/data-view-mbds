// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/streamgraph
// This code is modified version of it, to fit our data and needs.

export default function Streamgraph(data, keys, {
    width = 928,
    height = 500,
    marginTop = 10,
    marginRight = 10,
    marginBottom = 30,
    marginLeft = 40,
    xKey = "year",
    xLabel = "Year",
    yLabel = "Number of games"

} ) {

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

    const color = d3.scaleOrdinal()
        .domain(series.map(d => d.key))
        .range(d3.schemeTableau10);

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
        .call(g => g.append("text")
            .attr("x", -marginLeft)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(xLabel));

    // Append the x-axis and remove the domain line.
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .call(g => g.append("text")
            .attr("x", width - marginRight)
            .attr("y", -4)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text(yLabel));

    // Append a path for each series.
    svg.append("g")
        .selectAll()
        .data(series)
        .join("path")
        .attr("fill", d => color(d.key))
        .attr("d", area)
        .append("title")
        .text(d => d.key);

    // Return the chart with the color scale as a property (for the legend).
    return Object.assign(svg.node(), {scales: {color}});
}