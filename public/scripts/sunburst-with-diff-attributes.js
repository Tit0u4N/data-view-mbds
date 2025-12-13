import { getColor } from "./utils/color-manager.js";
import {addFullscreenButton, CONTAINER_WIDTH, renderAtCorrectSize} from './utils/fullscreen-manager.js';

// Store the currently selected year across re-renders
let currentSelectedYear = null;
let savedData;

// Attribute configuration
const ATTRIBUTES = [
    { id: 'category', label: 'Catégorie' },
    { id: 'isFree', label: 'Gratuit/Payant' },
    { id: 'os', label: 'Système d\'exploitation' },
    { id: 'type', label: 'Type de jeu' }
];

const ATTRIBUTE_LABELS = {
    'category': 'Catégorie',
    'isFree': 'Gratuit/Payant',
    'os': 'Système d\'exploitation',
    'type': 'Type de jeu'
};

const TOOLTIP_LABELS = ['Catégorie', 'Type (Gratuit/Payant)', 'OS', 'Type de jeu'];

export default (data) => {
    const containerId = 'sunburst-for-several-attributes';
    savedData = data;

    // Render function that accepts width and height
    const render = (data = savedData, containerWidth = CONTAINER_WIDTH, containerHeight = 420) => {
        // Save new data for fullscreen toggles
        savedData = data;

        // Define dimension and SVG container
        const margin = { top: 50, right: 140, bottom: 20, left: 20 };
        const width = containerWidth - margin.left - margin.right;
        const height = containerHeight - margin.top - margin.bottom;
        const totalWidth = containerWidth;
        const totalHeight = containerHeight;
        // Ensure we have an <svg> inside the container (the HTML uses a <div>)
        const container = d3.select(`#${containerId}`);

        // Make sure container has relative position for tooltip positioning and no overflow hidden
        container.style('position', 'relative')
            .style('overflow', 'visible');

        // Clear container and create fresh elements
        container.selectAll('*').remove();

        // Create tooltip on body so it persists and appears on top of everything
        d3.select('body').selectAll('.sunburst-tooltip').remove();
        const tooltip = d3.select('body').append('div')
            .attr('class', 'sunburst-tooltip')
            .style('position', 'fixed')
            .style('pointer-events', 'none')
            .style('padding', '10px 12px')
            .style('background', 'rgba(0,0,0,0.9)')
            .style('color', '#fff')
            .style('font-size', '14px')
            .style('font-family', 'sans-serif')
            .style('border-radius', '6px')
            .style('box-shadow', '0 2px 8px rgba(0,0,0,0.3)')
            .style('display', 'none')
            .style('z-index', '10000')
            .style('max-width', '300px');

        let svg = container.append('svg')
            .attr('id', 'sunburst-svg')
            .attr('width', totalWidth)
            .attr('height', totalHeight);

        const processedData = data.map(d => {
            const date = new Date(d.dateGlobal);
            const year = isNaN(date) ? null : date.getFullYear();
            
            // Convert type number to label
            let type = d.type;
            if (type == 1) type = 'Jeu';
            else if (type == 2) type = 'Bundles';
            else if (type == 3) type = 'DLC';
            
            return { 
                year, 
                category: d.category,
                isFree: (d.isFree === 'TRUE' || d.isFree === 'True' || d.isFree === true) ? 'Gratuit' : 'Payant',
                type,
                os: d.supportedOperatingSystems
            };
        }).filter(d => d.year && d.isFree && d.type && d.category);

        // Get all available years
        const years = [...new Set(processedData.map(d => d.year))].sort((a, b) => a - b);

        if (years.length === 0) {
            svg.append('text')
                .attr('x', totalWidth / 2)
                .attr('y', totalHeight / 2)
                .attr('text-anchor', 'middle')
                .style('font-family', 'sans-serif')
                .style('font-size', '14px')
                .style('fill', '#999')
                .text('Aucune donnée disponible');
            return;
        }

        // Create year selector dropdown above the chart
        const selectorContainer = container.append('div')
            .style('text-align', 'center')
            .style('margin-bottom', '10px')
            .style('padding', '10px');

        selectorContainer.append('label')
            .style('font-family', 'sans-serif')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('margin-right', '10px')
            .text('Sélectionner une année :');

        const yearSelect = selectorContainer.append('select')
            .attr('id', 'sunburst-year-selector')
            .style('padding', '5px 10px')
            .style('font-size', '14px')
            .style('border-radius', '4px')
            .style('border', '1px solid #ccc')
            .style('cursor', 'pointer')
            .style('margin-right', '20px');

        yearSelect.selectAll('option')
            .data(years)
            .enter()
            .append('option')
            .attr('value', d => d)
            .text(d => d);

        // Restore previously selected year if it exists and is still available
        currentSelectedYear = (currentSelectedYear && years.includes(currentSelectedYear)) ? currentSelectedYear : years[0];
        yearSelect.property('value', currentSelectedYear);

        // Create attribute checkboxes
        const checkboxContainer = selectorContainer.append('div')
            .style('display', 'inline-block')
            .style('margin-left', '20px')
            .style('text-align', 'left');

        checkboxContainer.append('label')
            .style('font-family', 'sans-serif')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('margin-right', '10px')
            .text('Anneaux à afficher :');

        const checkboxes = checkboxContainer.append('div')
            .style('display', 'inline-block');

    ATTRIBUTES.forEach(attr => {
        const checkboxWrapper = checkboxes.append('label')
            .style('margin-right', '15px')
            .style('font-family', 'sans-serif')
            .style('font-size', '13px')
            .style('cursor', 'pointer');

            checkboxWrapper.append('input')
                .attr('type', 'checkbox')
                .attr('id', `checkbox-${attr.id}`)
                .attr('value', attr.id)
                .property('checked', true)
                .style('margin-right', '5px')
                .style('cursor', 'pointer')
                .on('change', function () {
                    updateCheckboxStates();
                    updateSunburst();
                });

            checkboxWrapper.append('span').text(attr.label);
        });

        // Function to update checkbox states (disable if only one is checked)
        function updateCheckboxStates() {
            const checkedCount = ATTRIBUTES.filter(attr => 
                document.getElementById(`checkbox-${attr.id}`)?.checked
            ).length;

            ATTRIBUTES.forEach(attr => {
                const checkbox = document.getElementById(`checkbox-${attr.id}`);
                if (checkbox) {
                    const isLastChecked = checkedCount === 1 && checkbox.checked;
                    checkbox.disabled = isLastChecked;
                    checkbox.parentElement.style.cursor = isLastChecked ? 'not-allowed' : 'pointer';
                    checkbox.style.cursor = isLastChecked ? 'not-allowed' : 'pointer';
                }
            });
        }

        // Function to get selected attributes from checkboxes
        function getSelectedAttributes() {
            const selected = ATTRIBUTES
                .filter(attr => document.getElementById(`checkbox-${attr.id}`)?.checked)
                .map(attr => attr.id);
            return selected.length > 0 ? selected : ['os'];
        }

        // Function to render sunburst for selected year and attributes
        function renderSunburst(selectedYear) {
            const attributes = getSelectedAttributes();
            const yearFilteredData = processedData.filter(d => d.year === selectedYear);

            // console.log(`Sunburst showing data for year: ${selectedYear}`);

        // Note: Categories are already filtered in processedData (filtered by index.js)
        // Group categories: keep top 9 among the filtered categories, rest becomes "Autres"
        const categoryCounts = {};
        yearFilteredData.forEach(d => categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1);
        
        const top9Categories = Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 9)
            .map(([cat]) => cat);
        
        // Replace categories not in top 9 with "Autres"
        const processedYearData = yearFilteredData.map(d => ({
            ...d,
            category: top9Categories.includes(d.category) ? d.category : 'Autres'
        }));

        // console.log(`Top 9 catégories + Autres (filtré):`, [...top9Categories, 'Autres']);
        // console.log(`Nombre total de jeux après filtrage:`, processedYearData.length);

            // Attributes are now determined by checkbox selection
            // (already set in function parameter)

            // Build hierarchical structure from flat rows
            function buildHierarchy(rows, attrs) {
                const root = { name: 'root', children: [] };
                rows.forEach(r => {
                    let node = root;
                    attrs.forEach((attr, i) => {
                        const raw = r[attr];
                        const key = raw === undefined || raw === null || raw === '' ? 'Unknown' : String(raw);
                        if (!node.children) node.children = [];
                        let child = node.children.find(c => c.name === key);
                        if (!child) {
                            child = { name: key };
                            node.children.push(child);
                        }
                        node = child;
                        if (i === attrs.length - 1) {
                            node.value = (node.value || 0) + 1;
                        }
                    });
                });
                return root;
            }

            const hierarchyData = buildHierarchy(processedYearData, attributes);
            const categoryDepth = attributes.indexOf('category') + 1;

            // Set up drawing area
            const radius = Math.min(width, height) / 2;
            svg.selectAll('*').remove();
            
            // Add title in SVG
            svg.append('text')
                .attr('x', totalWidth / 2)
                .attr('y', 25)
                .attr('text-anchor', 'middle')
                .style('font-family', 'sans-serif')
                .style('font-size', '18px')
                .style('font-weight', 'bold')
                .style('fill', '#333')
                .text('Distribution des jeux selon différents attributs');
            
            // Define clipping zone for sunburst to keep it contained
            const sunburstClipId = 'sunburst-clip-' + Math.random().toString(36).substr(2, 9);
            svg.append('defs').append('clipPath')
                .attr('id', sunburstClipId)
                .append('rect')
                .attr('x', margin.left)
                .attr('y', margin.top)
                .attr('width', width)
                .attr('height', height);
            
            // Create a container group for sunburst with clipping
            const sunburstContainer = svg.append('g')
                .attr('clip-path', `url(#${sunburstClipId})`);
            
            const g = sunburstContainer.append('g')
                .attr('transform', `translate(${margin.left + width / 2}, ${margin.top + height / 2})`);

            const root = d3.hierarchy(hierarchyData).sum(d => d.value || 0).sort((a, b) => b.value - a.value);

            d3.partition().size([2 * Math.PI, radius])(root);

            // Create x and y scales for zoom
            const x = d3.scaleLinear()
                .range([0, 2 * Math.PI])
                .domain([0, 2 * Math.PI]);

            const y = d3.scaleLinear()
                .range([0, radius])
                .domain([0, radius]);

            const arc = d3.arc()
                .startAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x0))))
                .endAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x1))))
                .innerRadius(d => Math.max(0, y(d.y0)))
                .outerRadius(d => Math.max(0, y(d.y1)));

            // Helper function to get category color for a node
            const getNodeColor = (d) => {
                if (categoryDepth <= 0) return '#ccc';
                
                let categoryNode = d;
                while (categoryNode && categoryNode.depth > categoryDepth) {
                    categoryNode = categoryNode.parent;
                }
                if (categoryNode && categoryNode.depth === categoryDepth) {
                    return getColor(categoryNode.data.name);
                }
                const topAncestor = d.ancestors().reverse()[Math.min(categoryDepth, d.ancestors().length - 1)];
                return topAncestor ? getColor(topAncestor.data.name) : '#ccc';
            };

            g.selectAll('path')
                .data(root.descendants().filter(d => d.depth > 0))
                .enter().append('path')
                .attr('class', 'sunburst-arc')
                .attr('d', arc)
                .attr('fill', getNodeColor)
                .attr('stroke', '#fff')
                .attr('stroke-width', 1.5)
                .style('cursor', d => (categoryDepth > 0 && d.depth === categoryDepth) ? 'pointer' : 'default')
                .on('click', function() {
                const clickedNode = d3.select(this).datum();
                if (categoryDepth > 0 && clickedNode.depth === categoryDepth) {
                    focusOn(clickedNode);
                }
            })
            .on('mouseover', function() {
                const d = d3.select(this).datum();
                const event = d3.event;
                
                if (!d?.data?.name) return;
                
                d3.select(this).attr('opacity', 0.8);
                
                const label = TOOLTIP_LABELS[d.depth - 1] || 'Attribut';
                
                tooltip.html(`<strong>${label}:</strong> ${d.data.name}<br/><br/><strong>Nombre de jeux:</strong> ${d.value || 0}`)
                    .style('display', 'block')
                    .style('left', (event.clientX + 15) + 'px')
                    .style('top', (event.clientY + 15) + 'px');
            })
            .on('mousemove', function() {
                const event = d3.event;
                tooltip.style('left', (event.clientX + 15) + 'px')
                    .style('top', (event.clientY + 15) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 1);
                    tooltip.style('display', 'none');
                });

            // Calculate the inner radius of the first ring (categories)
            // Each ring takes up radius / number_of_attributes in height
            const ringHeight = radius / attributes.length;
            const centerCircleRadius = Math.max(10, ringHeight * 0.8); // 80% of first ring height
            
            // Add invisible center circle for zoom out (no visual, just clickable area)
            g.append('circle')
                .attr('r', centerCircleRadius)
                .style('fill', 'transparent')
                .style('cursor', 'pointer')
                .on('click', () => focusOn(root));

            // Zoom functionality
            function focusOn(node) {
                const transition = g.transition()
                    .duration(750)
                    .tween('scale', function() {
                        const xd = d3.interpolate(x.domain(), [node.x0, node.x1]);
                        const yd = d3.interpolate(y.domain(), [node.y0, radius]);
                        const yr = d3.interpolate(y.range(), [node.y0 ? 40 : 0, radius]);
                        return function(t) {
                            x.domain(xd(t));
                            y.domain(yd(t)).range(yr(t));
                        };
                    });

                transition.selectAll('path')
                    .attrTween('d', function(d) {
                        return function() { return arc(d); };
                    });
            }            // Simple legend showing attribute order (rings)
            const legend = svg.append('g')
                .attr('transform', `translate(${width + margin.left + 30}, ${margin.top + 10})`);

            // Add title showing the selected year
            legend.append('text')
                .attr('y', 0)
                .text(`Année: ${selectedYear}`)
                .style('font-family', 'sans-serif')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .style('fill', '#222');

            // Add styled section title for ring order
            legend.append('text')
                .attr('y', 30)
                .text('Ordre des anneaux')
                .style('font-family', 'sans-serif')
                .style('font-size', '12px')
                .style('font-weight', '600')
                .style('fill', '#555')
                .style('text-decoration', 'underline');

            // Add ring indicators with visual representation
            const ringLegend = legend.selectAll('.ring-item')
                .data(attributes)
                .enter().append('g')
                .attr('class', 'ring-item')
                .attr('transform', (d, i) => `translate(0, ${50 + i * 28})`);

            ringLegend.append('circle')
                .attr('cx', 8)
                .attr('cy', 0)
                .attr('r', 6)
                .style('fill', 'none')
                .style('stroke', '#666')
                .style('stroke-width', '2');

            ringLegend.append('text')
                .attr('x', 8)
                .attr('y', 4)
                .attr('text-anchor', 'middle')
                .text((d, i) => i + 1)
                .style('font-family', 'sans-serif')
                .style('font-size', '9px')
                .style('font-weight', 'bold')
                .style('fill', '#666');

            ringLegend.append('text')
                .attr('x', 22)
                .attr('y', 4)
                .text(d => ATTRIBUTE_LABELS[d] || d)
                .style('font-family', 'sans-serif')
                .style('font-size', '11px')
                .style('fill', '#333');            
            const colorLegendOffsetY = 50 + attributes.length * 28 + 20;
            const categorySet = new Set();
            
            if (categoryDepth > 0) {
                root.descendants().forEach(d => {
                    if (d.depth === categoryDepth) categorySet.add(d.data.name);
                });
            }
            
            // Create a group for the color legend and use makeLegends with scaling
            const colorLegendGroup = svg.append('g')
                .attr('transform', `translate(${width + margin.left + 10}, ${margin.top + colorLegendOffsetY}) scale(0.6)`);


            // console.log('Sunburst rendered for attributes:', attributes);
        }

        // Function to update sunburst based on current selections
        function updateSunburst(){
            const selectedYear =+ yearSelect.node().value;
            currentSelectedYear = selectedYear; // Save the current selection
            renderSunburst(selectedYear);
        }

        // Event listener for year selector
        yearSelect.on('change', updateSunburst);

        // Initial checkbox state and render
        updateCheckboxStates();
        renderSunburst(currentSelectedYear);    
        };

    // Function to render with saved data at correct size
    const renderFn = (newData) => renderAtCorrectSize(containerId, render, newData);

    // Initial render
    renderFn(data);

    // Add fullscreen button - with a slight delay to ensure DOM is ready
    setTimeout(() => addFullscreenButton(containerId, () => renderFn(savedData)), 100);

    // Return a function that can be called to re-render with new data
    return renderFn;
}
