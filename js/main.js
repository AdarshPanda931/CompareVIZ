// Define product parameters and their weights
const parameters = {
    'engine': { weight: 0.2, label: 'Engine Power (HP)' },
    'safety': { weight: 0.15, label: 'Safety Rating (1-10)' },
    'price': { weight: 0.15, label: 'Price ($)' },
    'height': { weight: 0.05, label: 'Height (mm)' },
    'weight': { weight: 0.05, label: 'Weight (kg)' },
    'style': { weight: 0.1, label: 'Styling (1-10)' },
    'comfort': { weight: 0.1, label: 'Comfort (1-10)' },
    'cc': { weight: 0.1, label: 'Engine CC' },
    'mileage': { weight: 0.05, label: 'Mileage (km/l)' },
    'efficiency': { weight: 0.05, label: 'Fuel Efficiency (1-10)' }
};

// State management
let state = {
    products: [],
    currentView: 'tableView',
    charts: {
        radar: null,
        scatter: null,
        line: null
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeUploadZone();
    initializeSortable();
    initializeViewControls();
    createComparisonTable();
});

// File upload handling
function initializeUploadZone() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');

    // Handle drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // Handle button click
    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle file input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const productId = Date.now() + Math.random().toString(36).substr(2, 9);
                const productName = file.name.split('.')[0];
                
                addProductToGallery({
                    id: productId,
                    name: productName,
                    image: e.target.result
                });
            };
            
            reader.readAsDataURL(file);
        }
    });
}

function addProductToGallery(product) {
    const gallery = document.getElementById('productGallery');
    const productElement = createProductElement(product);
    gallery.appendChild(productElement);
}

function createProductElement(product) {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.setAttribute('data-id', product.id);
    div.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
            <div class="product-name">${product.name}</div>
        </div>
    `;
    return div;
}

// Drag and drop functionality
function initializeSortable() {
    // Initialize gallery sortable
    new Sortable(productGallery, {
        group: {
            name: 'shared',
            pull: 'clone',
            put: false
        },
        animation: 150,
        sort: false
    });

    // Initialize table sortable
    document.querySelectorAll('.drop-zone').forEach(zone => {
        new Sortable(zone, {
            group: {
                name: 'shared',
                pull: false
            },
            animation: 150,
            onAdd: function(evt) {
                handleProductDrop(evt);
            }
        });
    });
}

function handleProductDrop(evt) {
    const productId = evt.item.getAttribute('data-id');
    const cell = evt.to;
    const rowIndex = cell.parentElement.rowIndex;
    const paramName = Object.keys(parameters)[rowIndex - 1];

    // Prompt for value
    const value = prompt(`Enter ${parameters[paramName].label} for ${evt.item.querySelector('.product-name').textContent}:`);
    
    if (value !== null) {
        updateProductData(productId, paramName, parseFloat(value));
        updateVisualization();
    } else {
        evt.item.remove(); // Remove if cancelled
    }
}

function updateProductData(productId, parameter, value) {
    let product = state.products.find(p => p.id === productId);
    
    if (!product) {
        product = {
            id: productId,
            name: document.querySelector(`[data-id="${productId}"] .product-name`).textContent,
            data: {}
        };
        state.products.push(product);
    }
    
    product.data[parameter] = value;
}

// Visualization functions
function createComparisonTable() {
    const table = document.createElement('table');
    table.className = 'comparison-table';

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Parameter</th><th class="drop-zone">Product</th><th class="drop-zone">Product</th><th class="drop-zone">Product</th>';
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create rows for each parameter
    const tbody = document.createElement('tbody');
    Object.entries(parameters).forEach(([param, details]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${details.label}</td>
            <td class="drop-zone"></td>
            <td class="drop-zone"></td>
            <td class="drop-zone"></td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    document.getElementById('tableContainer').appendChild(table);
}

function initializeViewControls() {
    const views = ['tableView', 'radarView', 'scatterView', 'lineView'];
    views.forEach(view => {
        document.getElementById(view).addEventListener('click', () => {
            switchView(view);
        });
    });
}

function switchView(viewId) {
    document.querySelectorAll('.view-container').forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById(viewId.replace('View', 'Container')).classList.add('active');
    state.currentView = viewId;
    updateVisualization();
}

function updateVisualization() {
    switch(state.currentView) {
        case 'tableView':
            updateTable();
            break;
        case 'radarView':
            updateRadarChart();
            break;
        case 'scatterView':
            updateScatterChart();
            break;
        case 'lineView':
            updateLineChart();
            break;
    }
}

function updateTable() {
    // Update existing table values
    state.products.forEach(product => {
        Object.entries(parameters).forEach(([param, details], index) => {
            const value = product.data[param];
            if (value !== undefined) {
                const cells = document.querySelectorAll(`.comparison-table tr:nth-child(${index + 2}) td`);
                cells.forEach(cell => {
                    const productElement = cell.querySelector(`[data-id="${product.id}"]`);
                    if (productElement) {
                        cell.setAttribute('data-value', value);
                    }
                });
            }
        });
    });
}

function updateRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');
    
    if (state.charts.radar) {
        state.charts.radar.destroy();
    }

    const labels = Object.values(parameters).map(p => p.label);
    const datasets = state.products.map((product, index) => {
        const color = getColor(index);
        return {
            label: product.name,
            data: Object.keys(parameters).map(param => product.data[param] || 0),
            backgroundColor: `rgba(${color}, 0.2)`,
            borderColor: `rgba(${color}, 1)`,
            pointBackgroundColor: `rgba(${color}, 1)`,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: `rgba(${color}, 1)`
        };
    });

    state.charts.radar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                line: {
                    borderWidth: 3
                }
            }
        }
    });
}

function updateScatterChart() {
    const ctx = document.getElementById('scatterChart').getContext('2d');
    
    if (state.charts.scatter) {
        state.charts.scatter.destroy();
    }

    const datasets = state.products.map((product, index) => {
        const color = getColor(index);
        return {
            label: product.name,
            data: Object.entries(product.data).map(([param, value]) => ({
                x: parameters[param].weight,
                y: value
            })),
            backgroundColor: `rgba(${color}, 0.7)`,
            borderColor: `rgba(${color}, 1)`
        };
    });

    state.charts.scatter = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Parameter Weight'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            }
        }
    });
}

function updateLineChart() {
    const ctx = document.getElementById('lineChart').getContext('2d');
    
    if (state.charts.line) {
        state.charts.line.destroy();
    }

    const labels = Object.values(parameters).map(p => p.label);
    const datasets = state.products.map((product, index) => {
        const color = getColor(index);
        return {
            label: product.name,
            data: Object.keys(parameters).map(param => product.data[param] || 0),
            borderColor: `rgba(${color}, 1)`,
            fill: false,
            tension: 0.4
        };
    });

    state.charts.line = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Utility functions
function getColor(index) {
    const colors = [
        '255, 99, 132',    // red
        '54, 162, 235',    // blue
        '255, 206, 86',    // yellow
        '75, 192, 192',    // green
        '153, 102, 255',   // purple
        '255, 159, 64'     // orange
    ];
    return colors[index % colors.length];
}

// Calculate weighted score for a product
function calculateScore(product) {
    let totalScore = 0;
    let maxPossibleScore = 0;

    Object.entries(parameters).forEach(([param, details]) => {
        if (product.data[param]) {
            const normalizedValue = (param === 'price') 
                ? 10 - (product.data[param] / 1000) 
                : (product.data[param] / 100) * 10;
            
            totalScore += normalizedValue * details.weight;
            maxPossibleScore += 10 * details.weight;
        }
    });

    return (totalScore / maxPossibleScore) * 100;
}