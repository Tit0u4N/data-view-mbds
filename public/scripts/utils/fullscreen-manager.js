export const CONTAINER_WIDTH = window.innerWidth / 2 - 80;

export let fullscreen_status = {};

/**
 * Fullscreen Manager Utility
 * Adds fullscreen functionality to visualization diagrams
 */

/**
 * Adds a fullscreen button to a diagram container
 * @param {string} containerId - ID of the container element (without #)
 * @param {Function} renderCallback - Function to re-render the diagram with new dimensions (width, height)
 * @param {any} data - Data to be passed to the renderCallback (since we don't manipulate it here we don't type it)
 */

export function renderAtCorrectSize(containerId, renderCallback, data) {
    const containerWidth = window.innerWidth / 2 - 80;
    const fullscreenWidth = window.innerWidth - 80;
    const fullscreenHeight = window.innerHeight - 280;
    if (fullscreen_status[containerId]) {
        renderCallback(data, fullscreenWidth, fullscreenHeight)
    } else {
        renderCallback(data, containerWidth)
    }
}

/**
 * Adds a fullscreen button to a diagram container
 * @param {string} containerId - ID of the container element (without #)
 * @param {Function} renderCallback - Function to re-render the diagram with new dimensions (width, height)
 */
export function addFullscreenButton(containerId, renderCallback) {
    const container = d3.select(`#${containerId}`);

    if (container.empty()) {
        console.error(`Container with id "${containerId}" not found`);
        return;
    }

    // Get the parent div that wraps the diagram
    const parentDiv = container.node().parentElement;

    // Create fullscreen button
    const fullscreenBtn = d3.select(parentDiv)
        .append('button')
        .attr('class', 'fullscreen-btn')
        .attr('title', 'Plein écran')
        .html('⛶') // Fullscreen icon
        .on('click', () => enterFullscreen());

    if(!fullscreen_status.hasOwnProperty(containerId))
        fullscreen_status[containerId] = false;
    let originalParent = parentDiv;
    let fullscreenContainer = null;

    let escapeEventListener = null;

    function enterFullscreen() {
        escapeEventListener = window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                exitFullscreen();
            }
        });
        // disable scroll
        document.body.style.overflowY = 'hidden';


        // Create fullscreen overlay
        fullscreenContainer = d3.select('body')
            .append('div')
            .attr('class', 'fullscreen-container')
            .style('position', 'fixed')
            .style('top', '0')
            .style('left', '0')
            .style('width', '100vw')
            .style('height', '100vh')
            .style('background', 'white')
            .style('z-index', '5000')
            .style('padding', '20px')
            .style('padding-top', '180px')
            .style('box-sizing', 'border-box')
            .style('overflow', 'auto');

        // Create close button
        fullscreenContainer
            .append('button')
            .attr('class', 'close-fullscreen-btn')
            .attr('title', 'Fermer (ESC)')
            .html('✕')
            .style('top', '165px')
            .on('click', exitFullscreen);

        // Move the diagram container to fullscreen
        const containerNode = container.node();
        fullscreenContainer.node().appendChild(containerNode);

        // Re-render diagram at fullscreen size
        fullscreen_status[containerId] = true;
        renderCallback();

        // Add ESC key listener
        d3.select('body').on('keydown.fullscreen', (event) => {
            if (event.key === 'Escape') {
                exitFullscreen();
            }
        });
    }

    function exitFullscreen() {
        if (!fullscreenContainer) return;
        window.removeEventListener('keydown', escapeEventListener);
        document.body.style.overflowY = 'auto';

        // Move diagram back to original location
        const containerNode = container.node();
        originalParent.insertBefore(containerNode, fullscreenBtn.node());

        // Remove fullscreen overlay
        fullscreenContainer.remove();
        fullscreenContainer = null;

        // Re-render diagram at original size
        fullscreen_status[containerId]  = false;
        renderCallback();

        // Remove ESC key listener
        d3.select('body').on('keydown.fullscreen', null);
    }
}
