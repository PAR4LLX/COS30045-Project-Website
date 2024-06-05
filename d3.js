
// Set dimensions and margins for the graph
const svgWidth = 1000;
const svgHeight = 800; // Increased height to accommodate thicker bars
const margin = { top: 20, right: 30, bottom: 40, left: 150 };
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
  .style("opacity", 0);

// Load JSON data
d3.json("Merged_health_data_by_year.json").then(data => {
    // Process data for a specific year
    const year = "2011"; // Change this to the desired year
    const countries = Object.keys(data[year]);

    const processedData = countries.map(country => ({
        group: country,
        GDP: +data[year][country].GDP,
        healthStatusValue: data[year][country]["Health status value"] ? +data[year][country]["Health status value"] : 0
    }));

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
    const maxHealthStatusValue = d3.max(processedData, d => d.healthStatusValue);

    const xLeft = d3.scaleLinear()
        .domain([0, maxGDP * 1.1]) // Adjusted domain to include padding for the max GDP
        .range([(width / 2) - (labelWidth / 2), 0]);

    const xRight = d3.scaleLinear()
        .domain([0, maxHealthStatusValue * 1.1]) // Adjusted domain to include padding for the max health status value
        .range([0, (width / 2) - (labelWidth / 2)]);

    // Add Y axis to the SVG without labels and remove lines
    svg.append("g")
        .call(d3.axisLeft(y0).tickSize(0).tickFormat(''))
        .selectAll("path")
        .style("stroke", "none"); // Remove Y axis line

    // Add X axis for GDP to the left
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xLeft).ticks(10));

    // Add X axis for Health status value to the right
    svg.append("g")
        .attr("transform", `translate(${width / 2 + labelWidth / 2},${height})`)
        .call(d3.axisBottom(xRight).ticks(10));

    // Bars for GDP (left side)
    svg.selectAll(".barLeft")
        .data(processedData)
        .enter()
        .append("rect")
        .attr("class", "barLeft")
        .attr("y", d => y0(d.group) + y1('GDP'))
        .attr("height", y1.bandwidth())
        .attr("x", d => xLeft(d.GDP)) // Start from the right
        .attr("width", d => xLeft(0) - xLeft(d.GDP)) // Adjust width calculation
        .style("fill", "steelblue")
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html("Country: " + d.group + "<br/>GDP: " + d.GDP)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Bars for Health status value (right side)
    svg.selectAll(".barRight")
        .data(processedData)
        .enter()
        .append("rect")
        .attr("class", "barRight")
        .attr("y", d => y0(d.group) + y1('GDP')) // Align bars at the same y-coordinate
        .attr("height", y1.bandwidth())
        .attr("x", width / 2 + labelWidth / 2)
        .attr("width", d => xRight(d.healthStatusValue))
        .style("fill", "orange")
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html("Country: " + d.group + "<br/>Health Status Value: " + d.healthStatusValue)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

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
        .text(d => d.group)
        .style("font-size", "12px");

    // Add labels for the axes
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `translate(${(width / 4) - (labelWidth / 4)},${height + margin.bottom - 10})`)
        .attr("text-anchor", "middle")
        .text("GDP");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", `translate(${(3 * width / 4) + (labelWidth / 4)},${height + margin.bottom - 10})`)
        .attr("text-anchor", "middle")
        .text("Health Status Value");

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
        .text("Countries");
});

