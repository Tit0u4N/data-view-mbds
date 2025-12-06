import Streamgraph from './utils/streamgraph.js';
import { getColor } from './utils/color-manager.js';
import {addFullscreenButton, CONTAINER_WIDTH, renderAtCorrectSize} from './utils/fullscreen-manager.js';

export default function makeNumberGameEvolution(data) {
    const containerId = 'free-paid-total-games-evolution';

    // Render function that accepts width and height
    const render = (containerWidth = CONTAINER_WIDTH, containerHeight = 400) => {
        // Define dimension and SVG container
        const width = containerWidth;
        const height = containerHeight;
        const svg = d3.select(`#${containerId}`).attr("width", width).attr("height", height);

        // parse date
        data = data.map(d => {
            const date = new Date(d.dateGlobal);
            return {
                ...d,
                date,
                year: date.getFullYear()
            };
        });


        // prepare data
        let grouped, categories;
        ({ grouped, categories } = makeDataByYearAndCategory(data))

        // Transform grouped data into an array suitable for stacking
        const dataByYearCategory = Object.keys(grouped).map(year => {
            const row = { year: new Date(Number(year), 0, 1) };
            categories.forEach(cat => {
                row[cat] = grouped[year][cat] || 0;
            });
            return row;
        });

        const colorMethod = getColor;

        // Build the graph
        const streamgraph = Streamgraph(dataByYearCategory, categories, {
            width: width,
            height: height,
            xKey: "year",
            xLabel: "Année",
            yLabel: "Nombre de jeux",
            color: (key) => colorMethod(key),
        });


        //add or replace in svg
        svg.html('');
        svg.node().append(streamgraph);
        // Add Title
        svg.append("g")
            .attr("transform", `translate(${width / 2},${20})`)
            .append("text")
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("font-weight", "bold")
            .text("Evolution du nombre de jeu par année et par genre");
    };

    // Initial render
    renderAtCorrectSize(containerId, render)

    // Add fullscreen button - with a slight delay to ensure DOM is ready
    setTimeout(() => addFullscreenButton(containerId, (w, h) => render(w, h)), 100);
}



function makeDataByYearAndCategory(data) {
    // make categories list
    const categories = [];
    data.forEach(d => {
        if (!categories.includes(d.category)) {
            categories.push(d.category);
        }
    });

    // Sort categories alphabetically
    categories.sort();

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

    return { grouped, categories };
}