
export default function makeLegends(container, legends, width, color, xOffset=0, yOffset=0) {
const legend = container.selectAll(".legend")
    .data(legends)
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(${xOffset},${yOffset+ i * 40})`); // Increased spacing (40px)

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
}