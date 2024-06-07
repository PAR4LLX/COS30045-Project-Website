// The svg
const svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// Map and projection
const projection = d3.geoNaturalEarth1()
    .scale(width / 1.3 / Math.PI)
    .translate([width / 2, height / 2]);

// Color mapping
const colorMap = {
    1: '#ff0000',
    2: '#ff1b00',
    3: '#ff3600',
    4: '#ff5100',
    5: '#ff6b00',
    6: '#ff8600',
    7: '#ffa100',
    8: '#ffbc00',
    9: '#ffd700',
    10: '#fff200',
    11: '#f2ff00',
    12: '#d7ff00',
    13: '#bcff00',
    14: '#a1ff00',
    15: '#86ff00',
    16: '#6bff00',
    17: '#51ff00',
    18: '#36ff00',
    19: '#1bff00',
    20: '#00ff00'
};

// Create a tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Load external data and boot
d3.json("./GeoMap.geojson").then(function(data) {

    // Draw the map
    svg.append("g")
        .selectAll("path")
        .data(data.features)
        .join("path")
            .attr("fill", function(d) {
                // Use the color property from the GeoJSON data
                let value = d.properties.value; // assuming each feature has a 'value' property
                return colorMap[value] || "#69b3a2"; // Default color if not specified
            })
            .attr("d", d3.geoPath().projection(projection))
            .style("stroke", "#fff")
            .on("mouseover", function(event, d) {
                d3.select(this).style("stroke", "black");
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html("Country: " + d.properties.name)  // Display country name
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
