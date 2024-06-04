// Path to the data file (adjust if necessary)
let data_file_path = './Merged_health_data_by_year.json';
let selectedYear = 2022; // Default selected year
let allData = {}; // Object to store all loaded data

// Load data and initialize dropdown
d3.json(data_file_path).then(data => {
    if (!data) {
        console.error("Failed to load data."); // Error handling if data loading fails
        return;
    }
    allData = data; // Store loaded data

    // Populate year dropdown
    const years = Object.keys(data).sort((a, b) => a - b); // Get and sort years
    const yearDropdown = d3.select('#yearDropdown'); // Select the dropdown element

    yearDropdown.selectAll('option')
        .data(years)
        .enter()
        .append('option')
        .attr('value', d => d)
        .text(d => d);

    // Update chart when the selected year changes
    yearDropdown.on('change', function() {
        selectedYear = +this.value;
        updateChart();
    });

    // Initial chart update
    updateChart();
}).catch(error => {
    console.error("Error loading the data file:", error); // Error handling if file loading fails
});

// Function to update the chart based on the selected year
function updateChart() {
    const filteredData = Object.values(allData[selectedYear] || {}); // Filter data for the selected year
    drawBarChart(filteredData); // Draw the bar chart with the filtered data
}

// Select the SVG element and set up margins and dimensions
const svg = d3.select('svg');
const margin = { top: 20, right: 30, bottom: 150, left: 60 };
const width = +svg.attr('width') - margin.left - margin.right;
const height = +svg.attr('height') - margin.top - margin.bottom;

// Define color scale for health status values
const color = d3.scaleLinear()
    .domain([0, 50, 100])
    .range(['red', 'yellow', 'green']);

// Function to get the inverse color
const getInverseColor = (color) => {
    if (!color) return 'black';
    const rgb = d3.color(color).rgb();
    return `rgb(${255 - rgb.r}, ${255 - rgb.g}, ${255 - rgb.b})`;
};

// Tooltip setup
const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('visibility', 'hidden');

// Function to update the chart title
function updateTitle(title) {
    d3.select('.chart-title').text(title);
}

// Function to draw the bar chart
function drawBarChart(data) {
    updateTitle(`Health Expenditure as Percentage of GDP in ${selectedYear}`);
    tooltip.style('visibility', 'hidden'); // Hide tooltip initially
    svg.selectAll("*").remove(); // Clear previous chart elements

    // Set up scales for the bar chart
    const x = d3.scaleBand()
        .domain(data.map(d => d.Country))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => +d.GDP) || 0]).nice()
        .range([height - margin.bottom, margin.top]);

    // Define x-axis
    const xAxis = g => g
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Define y-axis
    const yAxis = g => g
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    // Create bars for the bar chart
    svg.append('g')
        .selectAll('.bar')
        .data(data)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.Country))
        .attr('y', y(0))
        .attr('height', 0)
        .attr('width', x.bandwidth())
        .attr('fill', d => d['Health status value'] ? color(d['Health status value']) : 'gray')
        .on('mouseover', function(event, d) {
            const originalColor = d['Health status value'] ? color(d['Health status value']) : 'gray';
            const inverseColor = getInverseColor(originalColor);
            d3.select(this).attr('fill', inverseColor);
            tooltip.html(`Country: ${d.Country}<br>Expenditure: ${d.GDP}%<br>Health Status: ${d['Health status'] ? d['Health status'] : 'No Data'}`)
                .style('visibility', 'visible');
        })
        .on('mousemove', function(event) {
            tooltip.style('top', `${event.pageY - 10}px`).style('left', `${event.pageX + 10}px`);
        })
        .on('mouseout', function(event, d) {
            d3.select(this).attr('fill', d['Health status value'] ? color(d['Health status value']) : 'gray');
            tooltip.style('visibility', 'hidden');
        })
        .transition()
        .duration(1000)
        .attr('y', d => y(d.GDP))
        .attr('height', d => y(0) - y(d.GDP));

    // Append x-axis to the SVG
    svg.append('g')
        .call(xAxis);

    // Append y-axis to the SVG
    svg.append('g')
        .call(yAxis);

    // Add y-axis label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left - 60)
        .attr("x", -height / 3)
        .attr("dy", "1em")
        .text("GDP %");

    // Add x-axis label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2.30 + margin.left)
        .attr("y", height - 70)
        .text("Country");

    // Add legend for health status colors
    const legendWidth = 200;
    const legend = svg.append('g')
        .attr('transform', `translate(${(width - legendWidth) / 2},${height - 40})`);

    const legendGradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "legendGradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

    legendGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "red");

    legendGradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", "yellow");

    legendGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "green");

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", legendWidth)
        .attr("height", 20)
        .style("fill", "url(#legendGradient)");

    legend.append("text")
        .attr("x", 0)
        .attr("y", 40)
        .text("Poor Health")
        .style("font-size", "11px")
        .style("alignment-baseline", "middle");

    legend.append("text")
        .attr("x", legendWidth)
        .attr("y", 40)
        .text("Good Health")
        .style("font-size", "11px")
        .style("alignment-baseline", "middle")
        .style("text-anchor", "end");
}
