function createWhiteHatVis(data) {
  const width = 900;
  const height = 450;
  const margin = { top: 40, right: 120, bottom: 50, left: 60 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create the SVG container using your lab's viewBox and responsive style pattern
  const svg = d3.select('#white-hat-viz').append('svg')
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Year))
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => Math.max(d.female, d.male)) + 10])
    .range([innerHeight, 0]);

  // Axes & Gridlines
  chart.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  chart.append("g")
    .call(d3.axisLeft(y));

  chart.append("g")
    .attr("stroke", "#e0e0e0")
    .attr("stroke-opacity", 0.7)
    .call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(""))
    .selectAll("text").remove(); // Remove duplicate text from gridlines

  // Line Generators
  const lineMale = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.male));

  const lineFemale = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.female));

  // Draw Lines
  chart.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#2c3e50")
    .attr("stroke-width", 3)
    .attr("d", lineMale);

  chart.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#16a085")
    .attr("stroke-width", 3)
    .attr("d", lineFemale);

  // Axis Labels
  chart.append("text")
    .attr("text-anchor", "end")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 40)
    .style("font-size", "12px")
    .text("Year");

  chart.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -innerHeight / 2 + 50)
    .style("font-size", "12px")
    .text("Gross Enrollment (%)");

  // Simpler Legend Approach (using data binding and .join() from your lab)
  const legendData = [
    { label: "Female Enrollment", color: "#16a085" },
    { label: "Male Enrollment", color: "#2c3e50" }
  ];

  const legend = chart.append("g")
    .selectAll("g")
    .data(legendData)
    .join("g")
    .attr("transform", (d, i) => `translate(${innerWidth + 15},${i * 25 + 10})`);

  legend.append("text")
    .attr("x", 0)
    .attr("y", 0)
    .style("fill", d => d.color)
    .style("font-size", "12px")
    .attr("font-weight", "bold")
    .text(d => d.label);
}


function createBlackHatVis(data) {
  const width = 900;
  const height = 450;
  const margin = { top: 40, right: 120, bottom: 50, left: 60 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Cherry-pick a highly specific, short 4-year time window (2008 to 2012)
  const cherryPickedData = data.filter(d => d.Year >= 2008 && d.Year <= 2012);

  const svg = d3.select('#black-hat-viz').append('svg')
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // X scale (Cherry-picked span)
  const x = d3.scaleLinear()
    .domain(d3.extent(cherryPickedData, d => d.Year))
    .range([0, innerWidth]);

  // Y scale (Truncated baseline to exaggerate differences)
  const minVal = d3.min(cherryPickedData, d => Math.min(d.female, d.male));
  const maxVal = d3.max(cherryPickedData, d => Math.max(d.female, d.male));

  const y = d3.scaleLinear()
    .domain([minVal - 0.5, maxVal + 0.5])
    .range([innerHeight, 0]);

  // Axes
  chart.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(4).tickFormat(d3.format("d")));

  chart.append("g")
    .call(d3.axisLeft(y));

  // Line Generators
  const lineMale = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.male));

  const lineFemale = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.female));

  // Draw Lines (Misleading Encodings)
  chart.append("path")
    .datum(cherryPickedData)
    .attr("fill", "none")
    .attr("stroke", "#bdc3c7") // Passive grey
    .attr("stroke-width", 3)
    .attr("d", lineFemale);

  chart.append("path")
    .datum(cherryPickedData)
    .attr("fill", "none")
    .attr("stroke", "#c0392b") // Alarming red
    .attr("stroke-width", 3)
    .attr("d", lineMale);

  // Aggressive Axis label
  chart.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -innerHeight / 2 + 60)
    .style("font-size", "12px")
    .attr("font-weight", "bold")
    .text("ENROLLMENT COLLAPSE");

  // Intentionally Minimalist Legend
  const legendData = [
    { label: "MALE", color: "#c0392b", weight: "bold", size: "14px" },
    { label: "FEMALE", color: "#bdc3c7", weight: "normal", size: "12px" }
  ];

  const legend = chart.append("g")
    .selectAll("g")
    .data(legendData)
    .join("g")
    .attr("transform", (d, i) => `translate(${innerWidth + 15},${i * 25 + 10})`);

  legend.append("text")
    .attr("x", 0)
    .attr("y", 0)
    .style("fill", d => d.color)
    .style("font-size", d => d.size)
    .attr("font-weight", d => d.weight)
    .text(d => d.label);
}


function init() {
  d3.csv("gender.csv").then(data => {
    // Parse strings to numbers and isolate target metrics
    data.forEach(d => {
      d.Year = +d.Year;
      d.female_enrollment = +d['average_value_School enrollment, secondary, female (% gross)'];
      d.male_enrollment = +d['average_value_School enrollment, secondary, male (% gross)'];
    });

    // Filter out rows missing year or enrollment data
    const cleanData = data.filter(d => d.Year && d.female_enrollment && d.male_enrollment);

    // Calculate the global mean for male and female enrollment per year
    const rolledData = d3.rollups(cleanData,
      v => ({
        female: d3.mean(v, d => d.female_enrollment),
        male: d3.mean(v, d => d.male_enrollment)
      }),
      d => d.Year
    ).map(d => ({ Year: d[0], female: d[1].female, male: d[1].male }))
      .sort((a, b) => a.Year - b.Year);

    if (rolledData.length === 0) {
      console.error("No valid data found after filtering.");
      return;
    }

    // Draw both charts once data is ready
    createWhiteHatVis(rolledData);
    createBlackHatVis(rolledData);
  })
    .catch(error => console.error('Error loading data:', error));
}

// Trigger script using the event listener paradigm from your labs
window.addEventListener('load', init);