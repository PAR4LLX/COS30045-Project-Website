// Set dimensions and margins for the graph
const svgWidth = 1000;
const svgHeight = 600;
const margin = { top: 20, right: 30, bottom: 40, left: 20 }; // Reduced left margin
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

// Append SVG object to the body
const svg = d3.select("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Create the tooltip div and append it to the body
var tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "1px")
  .style("border-radius", "5px")
  .style("padding", "10px");

// Function to update the chart
function updateChart(data, healthType, year) {
    // Clear the existing SVG content
    svg.selectAll("*").remove();

    // Process data for the selected year
    const countries = Object.keys(data[year]);

    const processedData = countries.map(country => ({
        group: country,
        GDP: +data[year][country].GDP,
        healthStatusValue: data[year][country][healthType] ? +data[year][country][healthType] : 0
    })).filter(country => country.healthStatusValue !== 0 && !isNaN(country.GDP)); // Filter out countries with missing health or GDP data

    // Initialize Y axis to calculate maximum label width
    const y0 = d3.scaleBand()
        .domain(processedData.map(d => d.group))
        .range([height, 0])
        .padding(0.1); // Reduced padding to increase bar thickness

    // Calculate maximum label width
    const text = svg.append("g")
        .selectAll(".countryLabel")
        .data(processedData)
        .enter()
        .append("text")
        .attr("class", "countryLabel")
        .attr("x", width / 2) // Temporarily place labels
        .attr("y", d => y0(d.group) + y0.bandwidth() / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(d => d.group)
        .style("font-size", "12px");

    const maxLabelWidth = Math.max(...text.nodes().map(d => d.getBBox().width));
    text.remove(); // Remove temporary labels

    const labelWidth = maxLabelWidth + 10; // Adding some padding

    const y1 = d3.scaleBand()
        .domain(['GDP', 'healthStatusValue'])
        .range([0, y0.bandwidth()])
        .padding(0.2); // Reduced padding to increase bar thickness

    // X axis for GDP (left) and Health status value (right)
    const maxGDP = d3.max(processedData, d => d.GDP);

    const xLeft = d3.scaleLinear()
        .domain([0, maxGDP * 1.1]) // Adjusted domain to include padding for the max GDP
        .range([0, (width / 2) - (labelWidth / 2)]); // Correct range for right-to-left orientation

    const xRight = d3.scaleLinear()
        .domain([0, 100]) // Fixed domain for health status value
        .range([0, (width / 2) - (labelWidth / 2)]);

    // Add vertical grid lines
    svg.append("g")
        .attr("class", "grid")
        .selectAll("line")
        .data(xRight.ticks(10))
        .enter()
        .append("line")
        .attr("x1", d => xRight(d) + width / 2 + labelWidth / 2)
        .attr("x2", d => xRight(d) + width / 2 + labelWidth / 2)
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "white")
        .attr("stroke-width", 1);

    svg.append("g")
        .attr("class", "grid")
        .selectAll("line")
        .data(xLeft.ticks(10))
        .enter()
        .append("line")
        .attr("x1", d => width / 2 - labelWidth / 2 - xLeft(d))
        .attr("x2", d => width / 2 - labelWidth / 2 - xLeft(d))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "white")
        .attr("stroke-width", 1);

    // Add Y axis to the SVG without labels and remove lines
    svg.append("g")
        .call(d3.axisLeft(y0).tickSize(0).tickFormat(''))
        .selectAll("path")
        .style("stroke", "none"); // Remove Y axis line

    // Add X axis for GDP to the left
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xLeft).ticks(10).tickFormat(d => d)); // Ensure positive values

    // Add X axis for Health status value to the right
    svg.append("g")
        .attr("transform", `translate(${width / 2 + labelWidth / 2},${height})`)
        .call(d3.axisBottom(xRight).ticks(10));

    // Determine bar color based on health type
    let barColor;
    if (healthType === "Good/very good health") {
        barColor = "green";
    } else if (healthType === "Fair (not good, not bad) health") {
        barColor = "yellow";
    } else if (healthType === "Bad/very bad health") {
        barColor = "red";
    }

    // Bars for GDP (left side)
    svg.selectAll(".barLeft")
        .data(processedData)
        .enter()
        .append("rect")
        .attr("class", "barLeft")
        .attr("y", d => y0(d.group) + y1('GDP'))
        .attr("height", y1.bandwidth())
        .attr("x", width / 2 - labelWidth / 2) // Start position for the bars
        .attr("width", 0) // Start with width 0 for animation
        .style("fill", "steelblue")
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html("Country: " + d.group + "<br/>GDP: " + d.GDP)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .transition()
        .duration(1000) // Animation duration
        .attr("x", d => width / 2 - labelWidth / 2 - xLeft(d.GDP)) // Animate to the correct position
        .attr("width", d => xLeft(d.GDP)); // Animate to the correct width

    // Bars for Health status value (right side)
    svg.selectAll(".barRight")
        .data(processedData)
        .enter()
        .append("rect")
        .attr("class", "barRight")
        .attr("y", d => y0(d.group) + y1('GDP')) // Align bars at the same y-coordinate
        .attr("height", y1.bandwidth())
        .attr("x", width / 2 + labelWidth / 2)
        .attr("width", 0) // Start with width 0 for animation
        .style("fill", barColor)
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html("Country: " + d.group + "<br/>Health Status Value: " + d.healthStatusValue)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .transition()
        .duration(1000) // Animation duration
        .attr("width", d => xRight(d.healthStatusValue)); // Animate to final width

    // Add country labels in the middle with dynamic spacing
    svg.selectAll(".countryLabel")
        .data(processedData)
        .enter()
        .append("text")
        .attr("class", "countryLabel")
        .attr("x", width / 2) // Center of the chart
        .attr("y", d => y0(d.group) + y0.bandwidth() / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .style("opacity", 0) // Start with opacity 0 for animation
        .text(d => d.group)
        .style("font-size", "12px")
        .transition()
        .duration(1000) // Animation duration
        .style("opacity", 1); // Animate to opacity 1

    // Add labels for the axes
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `translate(${(width / 4) - (labelWidth / 4)},${height + margin.bottom - 10})`)
        .attr("text-anchor", "middle")
        .style("opacity", 0) // Start with opacity 0 for animation
        .text("GDP %")
        .transition()
        .duration(1000) // Animation duration
        .style("opacity", 1); // Animate to opacity 1

    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `translate(${(3 * width / 4) + (labelWidth / 4)},${height + margin.bottom - 10})`)
        .attr("text-anchor", "middle")
        .style("opacity", 0) // Start with opacity 0 for animation
        .text("Health Status %")
        .transition()
        .duration(1000) // Animation duration
        .style("opacity", 1); // Animate to opacity 1

    // Add Y axis labels on the right and remove lines
    svg.append("g")
        .attr("transform", `translate(${width + labelWidth / 2}, 0)`)
        .call(d3.axisRight(y0).tickSize(0))
        .selectAll("path")
        .style("stroke", "none"); // Remove Y axis line on the right

    // Add 'Countries' label in the middle below the x-axis
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `translate(${width / 2},${height + margin.bottom - 10})`)
        .attr("text-anchor", "middle")
        .style("opacity", 0) // Start with opacity 0 for animation
        .text("Countries")
        .transition()
        .duration(1000) // Animation duration
        .style("opacity", 1); // Animate to opacity 1
}

// Load JSON data
d3.json("Merged_health_data_by_year.json").then(data => {
    // Populate year dropdown
    const years = Object.keys(data);
    const yearSelect = d3.select("#yearSelect");

    yearSelect.selectAll("option")
      .data(years)
      .enter()
      .append("option")
      .attr("value", d => d)
      .text(d => d);

    // Initial load with default health status type and year
    updateChart(data, "Good/very good health", years[0]);

    // Add event listener to dropdowns
    d3.select("#healthType").on("change", function () {
        const selectedHealthType = d3.select(this).property("value");
        const selectedYear = d3.select("#yearSelect").property("value");
        updateChart(data, selectedHealthType, selectedYear);
    });

    d3.select("#yearSelect").on("change", function () {
        const selectedHealthType = d3.select("#healthType").property("value");
        const selectedYear = d3.select(this).property("value");
        updateChart(data, selectedHealthType, selectedYear);
    });
});

