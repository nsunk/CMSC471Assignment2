function createWhiteHatVis(data) {
    const width = 900, height = 450;
    const margin = {top: 40, right: 120, bottom: 50, left: 60};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select('#white-hat-viz').append('svg')
        .attr("width", width).attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 11px 'Inter', sans-serif;");
    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Initial Scales
    let x = d3.scaleLinear().domain(d3.extent(data, d => d.Year)).range([0, innerWidth]);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => Math.max(d.female, d.male)) + 10]).range([innerHeight, 0]);

    // Axes
    const xAxis = chart.append("g").attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")).tickSizeOuter(0));
    
    chart.append("g").call(d3.axisLeft(y).tickSizeOuter(0));
    chart.append("g").attr("stroke", "#e0e0e0").attr("stroke-opacity", 0.5)
        .call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat("")).selectAll("text").remove();

    // Line Generators
    const lineMale = d3.line().x(d => x(d.Year)).y(d => y(d.male));
    const lineFemale = d3.line().x(d => x(d.Year)).y(d => y(d.female));

    const pathMale = chart.append("path").datum(data).attr("fill", "none").attr("stroke", "#2c3e50").attr("stroke-width", 2.5).attr("d", lineMale);
    const pathFemale = chart.append("path").datum(data).attr("fill", "none").attr("stroke", "#16a085").attr("stroke-width", 2.5).attr("d", lineFemale);

    // Legend
    const legend = chart.append("g").selectAll("g")
        .data([{ label: "Female", color: "#16a085" }, { label: "Male", color: "#2c3e50" }])
        .join("g").attr("transform", (d, i) => `translate(${innerWidth + 20},${i * 25 + 10})`);
    
    legend.append("circle").attr("r", 5).attr("fill", d => d.color);
    legend.append("text").attr("x", 12).attr("y", 4).style("fill", "#444").style("font-size", "12px").text(d => d.label);

    // Tooltip & Crosshair
    const focus = chart.append("g").style("display", "none");
    focus.append("line").attr("class", "x-hover-line").attr("y1", 0).attr("y2", innerHeight).attr("stroke", "#aaa").attr("stroke-dasharray", "4,4");
    focus.append("circle").attr("class", "y-female").attr("r", 5).attr("fill", "#16a085");
    focus.append("circle").attr("class", "y-male").attr("r", 5).attr("fill", "#2c3e50");
    const tooltipText = focus.append("text").attr("x", 10).attr("dy", ".31em").style("font-size", "12px").style("fill", "#333");

    const bisectDate = d3.bisector(d => d.Year).left;

    chart.append("rect")
        .attr("width", innerWidth).attr("height", innerHeight).style("fill", "none").style("pointer-events", "all")
        .on("mouseover", () => focus.style("display", null))
        .on("mouseout", () => focus.style("display", "none"))
        .on("mousemove", function(event) {
            const x0 = x.invert(d3.pointer(event, this)[0]);
            const i = bisectDate(data, x0, 1);
            const d0 = data[i - 1], d1 = data[i];
            if(!d0 || !d1) return;
            const d = x0 - d0.Year > d1.Year - x0 ? d1 : d0;

            focus.attr("transform", `translate(${x(d.Year)},0)`);
            focus.select(".y-female").attr("transform", `translate(0,${y(d.female)})`);
            focus.select(".y-male").attr("transform", `translate(0,${y(d.male)})`);
            tooltipText.attr("y", y(Math.max(d.female, d.male)) - 15)
                .text(`${d.Year} - F: ${d.female.toFixed(1)}% | M: ${d.male.toFixed(1)}%`);
        });

    // Slider Interactivity
    d3.select("#white-slider").on("input", function() {
        const startYear = +this.value;
        d3.select("#white-year-label").text(startYear);
        const filteredData = data.filter(d => d.Year >= startYear);
        
        x.domain(d3.extent(filteredData, d => d.Year));
        xAxis.transition().duration(400).call(d3.axisBottom(x).tickFormat(d3.format("d")));
        pathMale.datum(filteredData).transition().duration(400).attr("d", lineMale);
        pathFemale.datum(filteredData).transition().duration(400).attr("d", lineFemale);
    });
}


function createBlackHatVis(data) {
    const width = 900, height = 450;
    const margin = {top: 40, right: 60, bottom: 50, left: 80};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select('#black-hat-viz').append('svg')
        .attr("width", width).attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 12px 'Inter', sans-serif;");
    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Get initial year data
    let currentYear = 2010;
    let yearData = data.find(d => d.Year === currentYear);
    
    // Format data for Bar Chart
    let barData = [
        { gender: "Male", value: yearData.male },
        { gender: "Female", value: yearData.female }
    ];

    // Scales
    const x = d3.scaleBand().domain(["Male", "Female"]).range([0, innerWidth]).padding(0.4);
    const xAxis = chart.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).tickSize(0));
    xAxis.selectAll("text").style("font-size", "14px").style("font-weight", "bold").attr("dy", "1em");

    // The Manipulation: Aggressive Truncation
    let minVal = Math.min(yearData.male, yearData.female);
    let maxVal = Math.max(yearData.male, yearData.female);
    
    const y = d3.scaleLinear()
        .domain([minVal - 0.2, maxVal + 0.2]) // Truncated just below the smallest bar!
        .range([innerHeight, 0]);
    
    const yAxisGroup = chart.append("g").call(d3.axisLeft(y).ticks(4));

    // Draw Bars
    const bars = chart.selectAll(".bar")
        .data(barData)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.gender))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.value))
        .attr("height", d => innerHeight - y(d.value))
        // Alarmist coloring: Lower value gets bleeding red, higher gets muted grey
        .attr("fill", d => d.value === minVal ? "#e74c3c" : "#bdc3c7");

    // Deceptive Tooltip
    const tooltipDiv = d3.select("body").append("div").attr("class", "tooltip-black");
    
    bars.on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 0.8);
        const gap = Math.abs(yearData.male - yearData.female).toFixed(2);
        tooltipDiv.style("opacity", 1)
            .html(`🚨 GAP: ${gap}% 🚨`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", function() {
        d3.select(this).attr("opacity", 1);
        tooltipDiv.style("opacity", 0);
    });

    // Aggressive Axis label
    chart.append("text").attr("text-anchor", "end").attr("transform", "rotate(-90)").attr("y", -50).attr("x", -innerHeight / 2 + 50)
        .style("font-size", "12px").attr("font-weight", "bold").style("fill", "#c0392b").text("CRITICAL THRESHOLD");

    // Slider Interactivity for the Bar Chart
    d3.select("#black-slider").on("input", function() {
        currentYear = +this.value;
        d3.select("#black-year-label").text(currentYear);
        
        yearData = data.find(d => d.Year === currentYear);
        if(!yearData) return;

        barData = [
            { gender: "Male", value: yearData.male },
            { gender: "Female", value: yearData.female }
        ];

        // Recalculate aggressive truncation for the new year
        minVal = Math.min(yearData.male, yearData.female);
        maxVal = Math.max(yearData.male, yearData.female);
        y.domain([minVal - 0.2, maxVal + 0.2]);

        yAxisGroup.transition().duration(300).call(d3.axisLeft(y).ticks(4));

        chart.selectAll(".bar")
            .data(barData)
            .transition().duration(300)
            .attr("y", d => y(d.value))
            .attr("height", d => innerHeight - y(d.value))
            .attr("fill", d => d.value === minVal ? "#e74c3c" : "#bdc3c7");
    });
}

function init() {
    d3.csv("gender.csv").then(data => {
        data.forEach(d => {
            d.Year = +d.Year;
            d.female = +d['average_value_School enrollment, secondary, female (% gross)'];
            d.male = +d['average_value_School enrollment, secondary, male (% gross)'];
        });

        const cleanData = data.filter(d => d.Year && d.female && d.male);
        
        const rolledData = d3.rollups(cleanData, 
            v => ({ female: d3.mean(v, d => d.female), male: d3.mean(v, d => d.male) }), 
            d => d.Year
        ).map(d => ({ Year: d[0], female: d[1].female, male: d[1].male }))
         .sort((a, b) => a.Year - b.Year); 

        createWhiteHatVis(rolledData);
        createBlackHatVis(rolledData);
    });
}

window.addEventListener('load', init);