// Tooltip div
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0); // Initially hidden tooltip

// Load data from CSV file
d3.csv("data.csv").then(function(data) {
    // Common margin and dimensions
    const margin = { top: 10, right: 30, bottom: 70, left: 60 },
          width = 460 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    // Function to create an SVG element for a chart
    const createSvg = (selector) => {
        return d3.select(selector).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    };

    // Function to create axes for a chart
    const createAxis = (svg, x, y, xLabel, yLabel) => {
        svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
        svg.append("g").call(d3.axisLeft(y));

        // Add X axis label
        svg.append("text").attr("class", "axis-title").attr("x", width).attr("y", height + 40).text(xLabel);
        // Add Y axis label
        svg.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)").attr("y", -margin.left + 20).attr("x", -10).text(yLabel);
    };

    // Function to add tooltip functionality
    const addTooltip = (selection, htmlFunc) => {
        selection.on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(htmlFunc(d)).style("left", (event.pageX + 5) + "px").style("top", (event.pageY - 28) + "px");
        }).on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));
    };

    // Scatter Plot: GDP vs. Average Wage
    const scatterSvg = createSvg("#scatter-plot");

    const xScatter = d3.scaleLinear().domain([0, 20]).range([0, width]);
    const yScatter = d3.scaleLinear().domain([30000, 90000]).range([height, 0]);

    createAxis(scatterSvg, xScatter, yScatter, "GDP (in Trillion USD)", "Average Wage (in USD)");

    const scatterCircles = scatterSvg.selectAll("circle").data(data).enter().append("circle")
        .attr("cx", d => xScatter(d.GDP)).attr("cy", d => yScatter(d.AverageWageUSD)).attr("r", 5).style("fill", "#69b3a2");

    addTooltip(scatterCircles, d => `GDP: ${d.GDP}<br>Wage: ${d.AverageWageUSD}`);

    // Bar Chart: GDP Per Capita by Country
    const barSvg = createSvg("#bar-chart");

    const xBar = d3.scaleBand().range([0, width]).domain(data.map(d => d.Country)).padding(0.2);
    const yBar = d3.scaleLinear().domain([0, 100000]).range([height, 0]);

    createAxis(barSvg, xBar, yBar, "Country", "GDP Per Capita (in USD)");

    const bars = barSvg.selectAll("rect").data(data).enter().append("rect")
        .attr("x", d => xBar(d.Country)).attr("y", d => yBar(d.GDPPerCapita)).attr("width", xBar.bandwidth()).attr("height", d => height - yBar(d.GDPPerCapita)).attr("fill", "#69b3a2");

    addTooltip(bars, d => `Country: ${d.Country}<br>GDP Per Capita: ${d.GDPPerCapita}`);

    // Line Chart: Number of Health Workers and Total Civilian Population
    const lineSvg = createSvg("#line-chart");

    const xLine = d3.scaleBand().range([0, width]).domain(data.map(d => d.Country)).padding(0.2);
    const yLine = d3.scaleLinear().domain([0, 8000000]).range([height, 0]);
    const yLine2 = d3.scaleLinear().domain([0, 0.35]).range([height, 0]);

    lineSvg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xLine)).selectAll("text").attr("transform", "translate(-10,0)rotate(-45)").style("text-anchor", "end");
    lineSvg.append("g").call(d3.axisLeft(yLine));
    lineSvg.append("g").attr("transform", `translate(${width},0)`).call(d3.axisRight(yLine2));

    lineSvg.append("text").attr("class", "axis-title").attr("x", width).attr("y", height + 60).text("Country");
    lineSvg.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)").attr("y", -margin.left + 20).attr("x", -10).text("Number of Health Workers");
    lineSvg.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)").attr("y", width + 50).attr("x", -10).text("Total Civilian Population (in billions)");

    const line1 = d3.line().x(d => xLine(d.Country)).y(d => yLine(d.NumHealthWorkers));
    const line2 = d3.line().x(d => xLine(d.Country)).y(d => yLine2(d.TotalCivPopulation));

    lineSvg.append("path").datum(data).attr("fill", "none").attr("stroke", "#69b3a2").attr("stroke-width", 1.5).attr("d", line1);
    lineSvg.append("path").datum(data).attr("fill", "none").attr("stroke", "#404080").attr("stroke-width", 1.5).attr("d", line2);

    const circles1 = lineSvg.selectAll("circle1").data(data).enter().append("circle").attr("cx", d => xLine(d.Country)).attr("cy", d => yLine(d.NumHealthWorkers)).attr("r", 5).attr("fill", "#69b3a2");
    const circles2 = lineSvg.selectAll("circle2").data(data).enter().append("circle").attr("cx", d => xLine(d.Country)).attr("cy", d => yLine2(d.TotalCivPopulation)).attr("r", 5).attr("fill", "#404080");

    addTooltip(circles1, d => `Country: ${d.Country}<br>Num Health Workers: ${d.NumHealthWorkers}`);
    addTooltip(circles2, d => `Country: ${d.Country}<br>Total Civ Population: ${d.TotalCivPopulation}`);
});
