// Set up the SVG element for the map
const svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// Define the map projection
const projection = d3.geoNaturalEarth1()
    .scale(width / 1.3 / Math.PI)
    .translate([width / 2, height / 2]);

// Define the reversed color scale (from green to red)
const colors = [
    '#00ff00', '#1bff00', '#36ff00', '#51ff00', '#6bff00', '#86ff00',
    '#a1ff00', '#bcff00', '#d7ff00', '#f2ff00', '#fff200', '#ffd700',
    '#ffbc00', '#ffa100', '#ff8600', '#ff6b00', '#ff5100', '#ff3600',
    '#ff1b00', '#ff0000'
];

// Create a tooltip for displaying additional information
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Load the new cases data from JSON file
d3.json("./NewCases.json").then(function(data) {
    // Populate the year dropdown with unique years from the data
    const years = [...new Set(data.map(d => d.B).filter(year => year !== "Year"))];
    const yearSelect = d3.select("#yearSelect");
    yearSelect.selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // Function to filter data and update the map based on user selection
    function updateMap() {
        const selectedYear = yearSelect.property("value");
        const selectedSanitation = d3.select("#healthType").property("value");
        const ignoreSanitation = d3.select("#ignoreSanitation").property("checked");

        // Filter the data based on the selected year and sanitation standard (if not ignored)
        const filteredData = data.filter(d => {
            if (d.B !== selectedYear) return false;
            if (!ignoreSanitation && d.D !== selectedSanitation) return false;
            return true;
        });

        // Create an object to map country names to new cases per million (rounded to 2 decimal places)
        const countryValues = {};
        filteredData.forEach(d => {
            countryValues[d.A] = +(+d.C).toFixed(2);  // Convert to number and round
        });

        // Determine the range of values for the color scale after filtering
        const values = Object.values(countryValues);

        // Use a quantile scale to ensure even distribution of colors
        const colorScale = d3.scaleQuantile()
            .domain(values)
            .range(colors);

        // Load the GeoJSON data and draw the map
        d3.json("./GeoMap.geojson").then(function(geoData) {
            // Remove existing paths to update the map
            svg.selectAll("path").remove();
            svg.append("g")
                .selectAll("path")
                .data(geoData.features)
                .join("path")
                    .attr("fill", function(d) {
                        // Get the country name and corresponding value
                        let country = d.properties.name;
                        let value = countryValues[country];
                        return colorScale(value) || "#69b3a2";  // Default color if value is missing
                    })
                    .attr("d", d3.geoPath().projection(projection))
                    .style("stroke", "#fff")
                    .on("mouseover", function(event, d) {
                        d3.select(this).style("stroke", "black");
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", .9);
                        tooltip.html("Country: " + d.properties.name + "<br>New Cases Per Million: " + countryValues[d.properties.name])  // Show country and value
                            .style("left", (event.pageX) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function(d) {
                        d3.select(this).style("stroke", "#fff");
                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });
        });
    }

    // Initial map rendering
    updateMap();

    // Update the map whenever the dropdown selections change
    yearSelect.on("change", updateMap);
    d3.select("#healthType").on("change", updateMap);
    d3.select("#ignoreSanitation").on("change", updateMap);
});
