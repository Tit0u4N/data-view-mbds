import { addFullscreenButton, CONTAINER_WIDTH } from './utils/fullscreen-manager.js';

export default async (data) => {
    const containerId = 'sunburst-for-several-attributes';

    // Render function that accepts width and height
    const render = (containerWidth = CONTAINER_WIDTH, containerHeight = 420) => {

        // Define dimension and SVG container
        const margin = { top: 20, right: 140, bottom: 20, left: 20 };
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
            const category = d.category;
            const isFree = (d.isFree === 'TRUE' || d.isFree === 'True' || d.isFree === true) ? 'Gratuit' : 'Payant';
            const type = d.type;
            const os = d.supportedOperatingSystems;
            return { year, category, isFree, type, os };
        }).filter(d => d.year !== null && d.isFree !== null && d.type && d.category);

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
        const selectorContainer = container.insert('div', ':first-child')
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

        // Create attribute checkboxes
        const allAttributes = [
            { id: 'os', label: 'OS', required: false },
            { id: 'isFree', label: 'Gratuit/Payant', required: false },
            { id: 'category', label: 'Catégorie', required: false },
            { id: 'type', label: 'Type de jeu', required: false }
        ];

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

        allAttributes.forEach(attr => {
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

            checkboxWrapper.append('span')
                .text(attr.label);
        });

        // Function to update checkbox states (disable if only one is checked)
        function updateCheckboxStates() {
            const checkedCount = allAttributes.filter(attr => {
                const checkbox = document.getElementById(`checkbox-${attr.id}`);
                return checkbox && checkbox.checked;
            }).length;

            allAttributes.forEach(attr => {
                const checkbox = document.getElementById(`checkbox-${attr.id}`);
                if (checkbox) {
                    // Disable if this is the last checked checkbox
                    if (checkedCount === 1 && checkbox.checked) {
                        checkbox.disabled = true;
                        checkbox.parentElement.style.cursor = 'not-allowed';
                        checkbox.style.cursor = 'not-allowed';
                    } else {
                        checkbox.disabled = false;
                        checkbox.parentElement.style.cursor = 'pointer';
                        checkbox.style.cursor = 'pointer';
                    }
                }
            });
        }

        // Function to get selected attributes from checkboxes
        function getSelectedAttributes() {
            const selected = [];
            allAttributes.forEach(attr => {
                const checkbox = document.getElementById(`checkbox-${attr.id}`);
                if (checkbox && checkbox.checked) {
                    selected.push(attr.id);
                }
            });
            // Ensure at least one attribute is selected
            return selected.length > 0 ? selected : ['os'];
        }

        // Function to render sunburst for selected year and attributes
        function renderSunburst(selectedYear) {
            const attributes = getSelectedAttributes();
            const yearFilteredData = processedData.filter(d => d.year === selectedYear);

            console.log(`Sunburst showing data for year: ${selectedYear}`);

            // Group categories: keep top 9, rest becomes "Autres"
            const categoryCounts = {};
            yearFilteredData.forEach(d => {
                categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
            });

            const sortedCategories = Object.entries(categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => cat);

            const top9Categories = sortedCategories.slice(0, 9);

            // Replace categories not in top 9 with "Autres"
            const processedYearData = yearFilteredData.map(d => ({
                ...d,
                category: top9Categories.includes(d.category) ? d.category : 'Autres'
            }));

            console.log(`Top 9 catégories + Autres:`, [...top9Categories, 'Autres']);

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

            // Set up drawing area
            const radius = Math.min(width, height) / 2;
            svg.selectAll('*').remove();
            const g = svg.append('g')
                .attr('transform', `translate(${margin.left + width / 2}, ${margin.top + height / 2})`);

            const root = d3.hierarchy(hierarchyData).sum(d => d.value || 0).sort((a, b) => b.value - a.value);

            d3.partition().size([2 * Math.PI, radius])(root);

            const color = d3.scaleOrdinal(d3.schemeCategory10);

            const arc = d3.arc()
                .startAngle(d => d.x0)
                .endAngle(d => d.x1)
                .innerRadius(d => d.y0)
                .outerRadius(d => d.y1);

            g.selectAll('path')
                .data(root.descendants().filter(d => d.depth > 0))
                .enter().append('path')
                .attr('class', 'sunburst-arc')
                .attr('d', arc)
                .attr('fill', d => {
                    // Color by category (3rd ring)
                    let categoryNode = d;
                    while (categoryNode && categoryNode.depth > 3) {
                        categoryNode = categoryNode.parent;
                    }
                    if (categoryNode && categoryNode.depth === 3) {
                        return color(categoryNode.data.name);
                    }
                    // If no category level (depth < 3), use parent coloring
                    const topAncestor = d.ancestors().reverse()[Math.min(3, d.ancestors().length - 1)];
                    return topAncestor ? color(topAncestor.data.name) : '#ccc';
                })
                .attr('stroke', '#fff')
                .attr('stroke-width', 1.5)
                .style('cursor', 'pointer')
                .on('mouseover', function () {
                    // Dans D3 v5, les données sont attachées à 'this', pas passées en paramètre
                    const d = d3.select(this).datum();
                    const event = d3.event; // En D3 v5, l'événement est accessible via d3.event

                    // Vérification complète
                    if (!d || !d.data || !d.data.name) {
                        return;
                    }

                    d3.select(this).attr('opacity', 0.8);

                    const dataName = d.data.name;
                    const count = d.value || 0;

                    // Déterminer le label selon la profondeur (quel anneau)
                    const labels = ['OS', 'Type (Gratuit/Payant)', 'Catégorie', 'Type de jeu'];
                    const label = labels[d.depth - 1] || 'Attribut';

                    tooltip.html(`<strong>${label}:</strong> ${dataName}<br/><br/><strong>Nombre de jeux:</strong> ${count}`)
                        .style('display', 'block')
                        .style('left', (event.clientX + 15) + 'px')
                        .style('top', (event.clientY + 15) + 'px');
                })
                .on('mousemove', function () {
                    const event = d3.event;
                    tooltip.style('left', (event.clientX + 15) + 'px')
                        .style('top', (event.clientY + 15) + 'px');
                })
                .on('mouseout', function () {
                    d3.select(this).attr('opacity', 1);
                    tooltip.style('display', 'none');
                });

            // Simple legend showing attribute order (rings)
            const legend = svg.append('g')
                .attr('transform', `translate(${width + margin.left + 10}, ${margin.top})`);

            // Add title showing the selected year
            legend.append('text')
                .attr('y', 0)
                .text(`Année: ${selectedYear}`)
                .style('font-family', 'sans-serif')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .style('fill', '#222');

            legend.selectAll('.attr-text')
                .data(attributes)
                .enter().append('text')
                .attr('class', 'attr-text')
                .attr('y', (d, i) => (i + 1) * 18 + 10)
                .text((d, i) => `${i + 1}. ${d}`)
                .style('font-family', 'sans-serif')
                .style('font-size', '12px');

            // Color legend: one swatch per first-level child (values of the first attribute)
            const colorLegendOffsetY = (attributes.length + 1) * 18 + 20;
            // Get all unique categories (3rd level) for the legend
            const thirdLevel = [];
            root.descendants().forEach(d => {
                if (d.depth === 3) {
                    if (!thirdLevel.find(item => item === d.data.name)) {
                        thirdLevel.push(d.data.name);
                    }
                }
            });
            const colorDomain = thirdLevel;
            color.domain(colorDomain);

            console.log(`Nombre de catégories uniques dans le sunburst: ${colorDomain.length}`);

            const colorLegend = svg.append('g')
                .attr('transform', `translate(${width + margin.left + 10}, ${margin.top + colorLegendOffsetY})`)
                .attr('class', 'color-legend');

            const swatchSize = 12;
            const rowHeight = 18;

            const entries = colorLegend.selectAll('.legend-entry')
                .data(colorDomain)
                .enter().append('g')
                .attr('class', 'legend-entry')
                .attr('transform', (d, i) => `translate(0, ${i * rowHeight})`);

            entries.append('rect')
                .attr('width', swatchSize)
                .attr('height', swatchSize)
                .attr('y', -swatchSize + 4)
                .attr('fill', d => color(d))
                .attr('stroke', '#222');

            entries.append('text')
                .attr('x', swatchSize + 8)
                .attr('y', 0)
                .text(d => d)
                .style('font-family', 'sans-serif')
                .style('font-size', '12px');

            console.log('Sunburst rendered for attributes:', attributes);
        }

        // Function to update sunburst based on current selections
        function updateSunburst() {
            const selectedYear = +yearSelect.node().value;
            renderSunburst(selectedYear);
        }

        // Event listener for year selector
        yearSelect.on('change', updateSunburst);

        // Initial checkbox state and render
        updateCheckboxStates();
        renderSunburst(years[0]);

    };

    // Initial render
    render();

    // Add fullscreen button - with a slight delay to ensure DOM is ready
    setTimeout(() => addFullscreenButton(containerId, (w, h) => render(w, h)), 100);
}