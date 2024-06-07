// Set the dimensions and margins of the graph
const margin = { top: 20, right: 150, bottom: 80, left: 150 },
  width = 1000 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;

// Append the svg object to the body of the page
const svg = d3
  .select("svg")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Create a tooltip
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("visibility", "hidden")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "1px")
  .style("border-radius", "5px")
  .style("padding", "10px");

// Load the JSON data
d3.json("Combined_data_by_country.json").then(function (data) {
  // Create a dropdown menu for multiple country selection
  const countries = Object.keys(data); // Get all country names
  const select = d3.select("#country-select");

  countries.forEach((country) => {
    select.append("option").attr("value", country).text(country);
  });

  // Listen for changes in the selection
  select.on("change", function () {
    const selectedCountries = Array.from(this.selectedOptions).map(
      (option) => option.value
    );
    if (selectedCountries.length > 3) {
      alert("You can select a maximum of 3 countries.");
      // Deselect the last selected option
      this.selectedOptions[this.selectedOptions.length - 1].selected = false;
      return;
    }
    updateChart(selectedCountries);
  });

  // Function to update the chart based on selected countries
  function updateChart(countries) {
    // Extract the relevant data for the selected countries over the years
    const dataArray = countries.map((country) => {
      return {
        country: country,
        values: Object.entries(data[country])
          .map(([year, value]) => ({
            year: +year,
            value: +value,
          }))
          .filter((d) => !isNaN(d.value)),
      };
    });

    // Sort dataArray by the total value of each country's data
    dataArray.sort((a, b) => {
      const aTotal = a.values.reduce((sum, d) => sum + d.value, 0);
      const bTotal = b.values.reduce((sum, d) => sum + d.value, 0);
      return bTotal - aTotal;
    });

    // Get all unique years from the selected countries' data
    const allYears = Array.from(
      new Set(dataArray.flatMap((countryData) => countryData.values.map((d) => d.year)))
    ).sort();

    // Get the maximum value for the selected data type
    const maxYValue = d3.max(dataArray.flatMap((d) => d.values), (d) => d.value);

    // Clear previous graph
    svg.selectAll("*").remove();

    // Add X axis
    const x = d3.scaleBand().range([0, width]).domain(allYears).padding(0.2);
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
      .style("fill", "white");

    // Style the X axis line
    svg.selectAll(".domain").style("stroke", "white");

    // Add X axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 20)
      .style("fill", "white")
      .text("Years");

    // Add Y axis
    const y = d3.scaleLinear().domain([0, maxYValue]).range([height, 0]);
    svg.append("g").call(d3.axisLeft(y))
      .selectAll("text").style("fill", "white");

    // Style the Y axis line
    svg.selectAll(".domain").style("stroke", "white");

    // Add Y axis label
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 60)
      .style("fill", "white")
      .text("% of Health Workers");

    // Add vertical grid lines behind the chart
    svg
      .selectAll(".xGrid")
      .data(allYears)
      .enter()
      .append("line")
      .attr("class", "xGrid")
      .attr("x1", (d) => x(d) + x.bandwidth() / 2)
      .attr("x2", (d) => x(d) + x.bandwidth() / 2)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#ccc")
      .attr("stroke-dasharray", "2,2");

    // Add lines and areas for each country
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    dataArray.forEach((countryData, i) => {
      const countryColor = color(i);

      // Add area
      const area = svg
        .append("path")
        .datum(countryData.values)
        .attr("fill", countryColor)
        .attr("fill-opacity", 0.3)
        .attr("stroke", "none")
        .attr(
          "d",
          d3
            .area()
            .x((d) => x(d.year) + x.bandwidth() / 2)
            .y0(y(0))
            .y1(y(0))
        );

      area.transition()
        .duration(1000)
        .attr(
          "d",
          d3
            .area()
            .x((d) => x(d.year) + x.bandwidth() / 2)
            .y0(y(0))
            .y1((d) => y(d.value))
        );

      // Add line
      const line = svg
        .append("path")
        .datum(countryData.values)
        .attr("fill", "none")
        .attr("stroke", countryColor)
        .attr("stroke-width", 1.5)
        .attr(
          "d",
          d3
            .line()
            .x((d) => x(d.year) + x.bandwidth() / 2)
            .y(y(0))
        );

      line.transition()
        .duration(1000)
        .attr(
          "d",
          d3
            .line()
            .x((d) => x(d.year) + x.bandwidth() / 2)
            .y((d) => y(d.value))
        );

      // Add circles
      const circles = svg
        .selectAll(`.dataCircle${i}`)
        .data(countryData.values)
        .enter()
        .append("circle")
        .attr("class", `dataCircle${i}`)
        .attr("fill", countryColor)
        .attr("stroke", "none")
        .attr("cx", (d) => x(d.year) + x.bandwidth() / 2)
        .attr("cy", y(0))
        .attr("r", 3)
        .on("mouseover", function (event, d) {
          tooltip
            .transition()
            .duration(200)
            .style("visibility", "visible")
            .style("opacity", 0.9);
          tooltip
            .html(`Country: ${countryData.country}<br>Year: ${d.year}<br>Value: ${d.value}`)
            .style("left", event.pageX + 5 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", function () {
          tooltip.transition().duration(500).style("visibility", "hidden").style("opacity", 0);
        });

      // Animate the circles after the lines and areas are drawn
      circles.transition()
        .duration(1000)
        .attr("cy", (d) => y(d.value));
    });

    // Update the legend
    d3.select(".legend-container")
      .html(
        dataArray
          .map(
            (countryData, i) =>
              `<div><span style="background-color: ${color(i)}; border-radius: 50%; display: inline-block; width: 12px; height: 12px; margin-right: 8px;"></span>${countryData.country}</div>`
          )
          .join("")
      );
  }

  // Initialize the chart with the first country
  updateChart([countries[0]]);
});

