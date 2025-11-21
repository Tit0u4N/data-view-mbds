import Streamgraph from './utilities/Streamgraph.js';

export default async (data) => {

    // Define dimension and SVG container
    const width = 1250
    const height = 1050;
    const svg = d3.select('#data-view-4 #scene').attr("width", width).attr("height", height);


    // parse date
    const parseDate = d3.timeParse("%d/%m/%Y %H:%M");
    data = data.map(d => {
        const date = parseDate(d.dateGlobal);
        return {
            ...d,
            date,
            year: date.getFullYear()
        };
    });

    // make categories list
    const categories = [];
    data.forEach(d => {
        if (!categories.includes(d.category)) {
            categories.push(d.category);
        }
    });

    // Group data by year and category
    const grouped = {};

    data.forEach(d => {
        if (!grouped[d.year]) {
            grouped[d.year] = {};
        }
        if (!grouped[d.year][d.category]) {
            grouped[d.year][d.category] = 0;
        }
        grouped[d.year][d.category]++;
    });


    // Transform grouped data into an array suitable for stacking
    const dataByYearCategory = Object.keys(grouped).map(year => {
        const row = { year: new Date(+year, 0, 1) };
        categories.forEach(cat => {
            row[cat] = grouped[year][cat] || 0;
        });
        return row;
    });

    // Build the graph
    const streamgraph = Streamgraph(dataByYearCategory, categories, {
        width: width,
        height: height,
        xKey: "year",
        xLabel: "Year",
        yLabel: "Number of games"
    });
    svg.node().appendChild(streamgraph);


}