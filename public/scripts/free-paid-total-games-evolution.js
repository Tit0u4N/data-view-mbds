import Streamgraph from './utils/streamgraph.js';
import {getColor, getPricingTypeColor} from './utils/color-manager.js';
import makeLegends from "./utils/make-lengends.js";

export default function makeNumberGameEvolution(data, selectedMod = "category" ) {
    // Define dimension and SVG container
    const width = 1000;
    const sidePanelWidth = 180;
    const height = 600;
    const buttonWidth = 80;
    const buttonHeight = 30;
    const svg = d3.select('#free-paid-total-games-evolution').attr("width", width).attr("height", height);
    const mods = ["category", "pricingType"];

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


    // prepare data
    let grouped, categories;
    if (selectedMod === "pricingType") {
        ({grouped, categories} = makeDataByYearAndPricingType(data));
    } else {
        ({grouped, categories} = makeDataByYearAndCategory(data));
    }


    // Transform grouped data into an array suitable for stacking
    const dataByYearCategory = Object.keys(grouped).map(year => {
        const row = { year: new Date(+year, 0, 1) };
        categories.forEach(cat => {
            row[cat] = grouped[year][cat] || 0;
        });
        return row;
    });

    const colorMethod = selectedMod === "pricingType" ? getPricingTypeColor : getColor;
    const title = getLabelByMod(selectedMod);

    // Build the graph
    const streamgraph = Streamgraph(dataByYearCategory, categories, {
        width: width-sidePanelWidth,
        height: height,
        xKey: "year",
        xLabel: "Year",
        yLabel: "Number of games",
        color: (key) => colorMethod(key),
        title: `Evolution du nombre de jeu par année, groupé par ${title}`,
    });


    //add or replace in svg
    svg.html('');
    svg.node().append(streamgraph);

    // add side panel with color legend
    svg.selectAll(".side-panel").remove();
    const sidePanel = svg.append("g")
        .attr("class", "side-panel")
        .attr("transform", `translate(${width - sidePanelWidth + 20}, 50)`);


    makeLegends(sidePanel, categories, 0, colorMethod, 0, buttonHeight + 20);

    // add selector for mods
    const buttonGroup = sidePanel.append("g")
        .attr("class", "mod-button-group")
        .attr("transform", "translate(0, 0)");

    const buttons = buttonGroup.selectAll(".mod-button")
        .data(mods)
        .enter()
        .append("g")
        .attr("class", "mod-button")
        .attr("transform", (d, i) => `translate(${i * buttonWidth}, 0)`)
        .style("cursor", "pointer")
        .on("click", function(event, d) {
            selectedMod = mods[d]
            makeNumberGameEvolution(data, selectedMod);
        });


    buttons.append("rect")
        .attr("width", buttonWidth)
        .attr("height", buttonHeight)
        .attr("rx", 4) // arrondi
        .attr("ry", 4);


    buttons.append("text")
        .attr("x", buttonWidth / 2)
        .attr("y", buttonHeight / 2 + 5)
        .attr("text-anchor", "middle")
        .attr("font-size", 14)
        .text(d => getLabelByMod(d));

    buttonGroup.selectAll(".mod-button").each(function(d) {
        const isSelected = d === selectedMod;

        d3.select(this).select("rect")
            .attr("fill", isSelected ? "#4a90e2" : "#e0e0e0")   // couleur sélection / normal
            .attr("stroke", isSelected ? "#2a70c2" : "#999")
            .attr("stroke-width", isSelected ? 2 : 1);

        d3.select(this).select("text")
            .attr("font-weight", isSelected ? "bold" : "normal")
            .attr("fill", isSelected ? "white" : "black");
    });
}

function getLabelByMod(mod) {
    if (mod === "pricingType") {
        return "Prix";
    }
    return "Catégorie";
}


function makeDataByYearAndPricingType(data) {
    const categories = ["Free", "Paid"];

    // Group data by year and category
    const grouped = {};

    data.forEach(d => {
        if (!grouped[d.year]) {
            grouped[d.year] = {};
        }
        if (d.isFree === 'TRUE')
            !grouped[d.year]["Free"] ? grouped[d.year]["Free"] = 1 : grouped[d.year]["Free"] += 1;
        else
            !grouped[d.year]["Paid"] ? grouped[d.year]["Paid"] = 1 : grouped[d.year]["Paid"] += 1;
    });

    return {grouped, categories};
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

    return {grouped, categories};
}