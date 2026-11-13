// --- WHITE HAT: Education (Enrollment + Total Context) ---
const IND_PRI_M = "School enrollment, primary, male (% gross)";
const IND_PRI_F = "School enrollment, primary, female (% gross)";
const IND_PRI_T = "School enrollment, primary (% gross)"; // Total Context

const IND_SEC_M = "School enrollment, secondary, male (% gross)";
const IND_SEC_F = "School enrollment, secondary, female (% gross)";
const IND_SEC_T = "School enrollment, secondary (% gross)"; // Total Context

const IND_TER_M = "School enrollment, tertiary, male (% gross)";
const IND_TER_F = "School enrollment, tertiary, female (% gross)";
const IND_TER_T = "School enrollment, tertiary (% gross)"; // Total Context

// --- WHITE HAT: Employment Breakdown ---
const IND_WAGE_M = "Wage and salaried workers, male (% of male employment) (modeled ILO estimate)";
const IND_WAGE_F = "Wage and salaried workers, female (% of female employment) (modeled ILO estimate)";
const IND_SELF_M = "Self-employed, male (% of male employment) (modeled ILO estimate)";
const IND_SELF_F = "Self-employed, female (% of female employment) (modeled ILO estimate)";
const IND_EMP_M = "Employers, male (% of male employment) (modeled ILO estimate)";
const IND_EMP_F = "Employers, female (% of female employment) (modeled ILO estimate)";

// --- OVERALL LABOR FORCE (Employment Context) & BLACK HAT ---
const IND_LFP_M = "Labor force participation rate, male (% of male population ages 15+) (modeled ILO estimate)";
const IND_LFP_F = "Labor force participation rate, female (% of female population ages 15+) (modeled ILO estimate)";
const BLACK_HAT_REGIONS = ['United States', 'Japan', 'Germany', 'Brazil', 'India', 'World'];

// Colors for White Hat (Blue & Orange)
const COLOR_MALE = "#1976D2"; 
const COLOR_FEMALE = "#F57C00";

let globalData = [];
let validDataMap = {};
let zoomBehaviors = [];

function drawDumbbell(containerId, chartTitle, dataArr) {
    const width = 600, height = 450; 
    const margin = {top: 70, right: 40, bottom: 60, left: 140}; 
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    d3.select(containerId).selectAll("*").remove();

    const svg = d3.select(containerId).append('svg')
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 14px 'Inter', sans-serif; overflow: hidden;");
    
    svg.append("defs").append("clipPath")
        .attr("id", `clip-${containerId.replace('#', '')}`)
        .append("rect")
        .attr("width", innerW).attr("height", innerH);

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // 1. BACKGROUND RESET
    chart.append("rect")
        .attr("width", innerW).attr("height", innerH)
        .attr("fill", "transparent")
        .style("cursor", "default")
        .on("click", () => {
            svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        });

    const zoomGroup = chart.append("g").attr("clip-path", `url(#clip-${containerId.replace('#', '')})`);

    // 2. TITLES & LEGEND
    svg.append("text").attr("x", margin.left - 20).attr("y", 25).text(chartTitle)
        .style("font-size", "18px").style("font-weight", "800").style("fill", "#111");

    svg.append("text").attr("x", margin.left - 20).attr("y", 45).text("Click a row to zoom into the gap. Click the background to reset.")
        .style("font-size", "12px").style("fill", "#777").style("font-style", "italic");

    // Dynamic Legend placement
    const legend = svg.append("g").attr("transform", `translate(${margin.left + 230}, 20)`);
    legend.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 6).attr("fill", COLOR_MALE);
    legend.append("text").attr("x", 10).attr("y", 4).text("Men").style("font-size", "13px").style("font-weight", "600").style("fill", "#333");
    legend.append("circle").attr("cx", 60).attr("cy", 0).attr("r", 6).attr("fill", COLOR_FEMALE);
    legend.append("text").attr("x", 70).attr("y", 4).text("Women").style("font-size", "13px").style("font-weight", "600").style("fill", "#333");

    // 3. SCALES & AXES
    const categories = dataArr.map(d => d.category);
    const y = d3.scaleBand().domain(categories).range([0, innerH]).padding(1);
    let x = d3.scaleLinear().domain([0, 110]).range([0, innerW]);

    const xAxis = chart.append("g").attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(x).ticks(6).tickSizeOuter(0));
    xAxis.selectAll("text").style("color", "#666").style("font-size", "14px");
    
    chart.append("g").call(d3.axisLeft(y).tickSize(0))
        .selectAll("text").style("font-size", "14px").style("font-weight", "600").style("fill", "#333").attr("dx", "-10px")
        .style("pointer-events", "none");

    const gridLines = chart.append("g").attr("stroke-opacity", 0.1)
        .call(d3.axisBottom(x).ticks(6).tickSize(innerH).tickFormat(""));

    // 4. ZOOM LOGIC
    const zoom = d3.zoom()
        .scaleExtent([1, 15])
        .translateExtent([[0, 0], [innerW, innerH]])
        .on("zoom", (event) => {
            const newX = event.transform.rescaleX(x);
            xAxis.call(d3.axisBottom(newX).ticks(6).tickSizeOuter(0));
            gridLines.call(d3.axisBottom(newX).ticks(6).tickSize(innerH).tickFormat(""));
            updatePositions(newX);
        });
    svg.call(zoom);
    zoomBehaviors.push({ svg: svg, zoom: zoom });

    // 5. TOOLTIP FORMATTER (Injects the overall contextual data)
    let tooltip = d3.select(".tooltip-white");
    if (tooltip.empty()) tooltip = d3.select("body").append("div").attr("class", "tooltip-white");

    function getTooltipHTML(d) {
        let extra = "";
        // If it's an Education row, show overall enrollment
        if (d.total) {
            extra = `<div style="margin-top:6px; padding-top:6px; border-top:1px solid #ddd; font-size:11px; color:#555;">
                        Overall Enrollment: <strong>${d.total.toFixed(1)}%</strong>
                     </div>`;
        }
        // If it's an Employment row, show overall labor force participation
        if (d.lfpM) {
            extra = `<div style="margin-top:6px; padding-top:6px; border-top:1px solid #ddd; font-size:11px; color:#555;">
                        Overall Labor Force Participation:<br/>
                        Men: <strong>${d.lfpM.toFixed(1)}%</strong> | Women: <strong>${d.lfpF.toFixed(1)}%</strong>
                     </div>`;
        }
        return `
            <strong style="font-size:14px;">${d.category}</strong><br/>
            <span style="color:${COLOR_MALE}; font-weight:bold;">Men: ${d.male.toFixed(1)}%</span><br/>
            <span style="color:${COLOR_FEMALE}; font-weight:bold;">Women: ${d.female.toFixed(1)}%</span>
            ${extra}
        `;
    }

    // 6. INVISIBLE HIT AREAS (Allows hovering/clicking anywhere on the row)
    chart.selectAll(".row-hit").data(dataArr).join("rect")
        .attr("class", "row-hit")
        .attr("x", 0).attr("y", d => y(d.category) - 25)
        .attr("width", innerW).attr("height", 50).attr("fill", "transparent").style("cursor", "zoom-in")
        .on("mousemove", function(event, d) {
            tooltip.style("opacity", 1).html(getTooltipHTML(d))
                .style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() { tooltip.style("opacity", 0); })
        .on("click", function(event, d) {
            const minVal = Math.min(d.male, d.female);
            const maxVal = Math.max(d.male, d.female);
            const gapMid = x((minVal + maxVal) / 2);
            const gapWidth = Math.max(x(maxVal) - x(minVal), 1); 
            let targetScale = (innerW * 0.6) / gapWidth;
            targetScale = Math.min(12, Math.max(3, targetScale));
            const tx = innerW / 2 - gapMid * targetScale;
            svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(tx, 0).scale(targetScale));
            event.stopPropagation();
        });

    // 7. DRAW DOTS AND LINES
    const gapLines = zoomGroup.selectAll(".gap-line").data(dataArr).join("line")
        .attr("class", "gap-line")
        .attr("y1", d => y(d.category)).attr("y2", d => y(d.category))
        .attr("stroke", "#dcdcdc").attr("stroke-width", 6)
        .style("pointer-events", "none");

    const femaleDots = zoomGroup.selectAll(".female-dot").data(dataArr).join("circle")
        .attr("class", "female-dot")
        .attr("cy", d => y(d.category)).attr("r", 10).attr("fill", COLOR_FEMALE);

    const maleDots = zoomGroup.selectAll(".male-dot").data(dataArr).join("circle")
        .attr("class", "male-dot")
        .attr("cy", d => y(d.category)).attr("r", 10).attr("fill", COLOR_MALE);

    // Provide dot-specific hover triggers (so dots pop out when touched)
    zoomGroup.selectAll("circle")
        .on("mousemove", function(event, d) {
            d3.select(this).attr("stroke", "#000").attr("stroke-width", 2).attr("r", 12);
            tooltip.style("opacity", 1).html(getTooltipHTML(d))
                .style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", "none").attr("r", 10);
            tooltip.style("opacity", 0);
        });

    function updatePositions(newX) {
        gapLines.attr("x1", d => newX(Math.min(d.male, d.female)))
                .attr("x2", d => newX(Math.max(d.male, d.female)));
        femaleDots.attr("cx", d => newX(d.female));
        maleDots.attr("cx", d => newX(d.male));
    }
    updatePositions(x); 
}

function updateWhiteHatVisuals(countryCode, targetYear) {
    zoomBehaviors = []; 
    const rows = globalData.filter(d => d['Country Code'] === countryCode);
    
    const getData = (ind) => {
        const row = rows.find(d => d['Indicator Name'] === ind);
        return row && row[targetYear] ? +row[targetYear] : 0;
    };

    // Passing the 'total' property into the dataset
    const eduData = [
        { category: "Primary Ed.", male: getData(IND_PRI_M), female: getData(IND_PRI_F), total: getData(IND_PRI_T) },
        { category: "Secondary Ed.", male: getData(IND_SEC_M), female: getData(IND_SEC_F), total: getData(IND_SEC_T) },
        { category: "Tertiary Ed.", male: getData(IND_TER_M), female: getData(IND_TER_F), total: getData(IND_TER_T) }
    ].filter(d => d.male > 0 || d.female > 0); 

    // Passing the LFP context into the dataset
    const lfpM = getData(IND_LFP_M);
    const lfpF = getData(IND_LFP_F);

    const empData = [
        { category: "Wage/Salaried", male: getData(IND_WAGE_M), female: getData(IND_WAGE_F), lfpM, lfpF },
        { category: "Self-Employed", male: getData(IND_SELF_M), female: getData(IND_SELF_F), lfpM, lfpF },
        { category: "Employers", male: getData(IND_EMP_M), female: getData(IND_EMP_F), lfpM, lfpF }
    ].filter(d => d.male > 0 || d.female > 0);

    drawDumbbell('#white-edu-viz', "Educational Enrollment", eduData);
    drawDumbbell('#white-emp-viz', "Employment Hierarchy", empData);
}

// ... [Keep your createBlackHatVis(targetYear) exactly the same as before!] ...
function createBlackHatVis(targetYear) {
    const width = 900, height = 450;
    const margin = {top: 40, right: 60, bottom: 60, left: 60};
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    d3.select('#black-hat-viz').selectAll("*").remove();
    const svg = d3.select('#black-hat-viz').append('svg')
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 12px 'Inter', sans-serif;");
    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    let barData = [];
    BLACK_HAT_REGIONS.forEach(country => {
        const countryRows = globalData.filter(d => d['Country Name'] === country);
        const lfpM = countryRows.find(d => d['Indicator Name'] === IND_LFP_M);
        const lfpF = countryRows.find(d => d['Indicator Name'] === IND_LFP_F);
        
        if (lfpM && lfpF && lfpM[targetYear] && lfpF[targetYear]) {
            barData.push({ country: country, gender: "Female", val: +lfpF[targetYear] });
            barData.push({ country: country, gender: "Male", val: +lfpM[targetYear] });
        }
    });

    const x = d3.scaleBand().domain(BLACK_HAT_REGIONS).range([0, innerW]).padding(0.3);
    const FALSE_BASELINE = 60;
    const y = d3.scaleLinear().domain([10, 90]).range([innerH, 0]);

    chart.append("g").attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .selectAll("text").style("fill", "#333").style("font-size", "13px").style("font-weight", "600").attr("dy", "10px");

    chart.append("g").call(d3.axisLeft(y).ticks(8)).attr("stroke", "#ccc")
        .selectAll("text").style("fill", "#666").style("font-size", "11px");

    chart.append("line")
        .attr("x1", 0).attr("x2", innerW).attr("y1", y(FALSE_BASELINE)).attr("y2", y(FALSE_BASELINE))
        .attr("stroke", "#333").attr("stroke-width", 2);

    const bars = chart.append("g").selectAll("rect").data(barData).join("rect")
        .attr("x", d => x(d.country)).attr("width", x.bandwidth())
        .attr("y", d => Math.min(y(d.val), y(FALSE_BASELINE)))
        .attr("height", d => Math.abs(y(d.val) - y(FALSE_BASELINE)))
        .attr("fill", d => d.gender === "Male" ? "#2980b9" : "#d32f2f").attr("opacity", 0.9);

    let tooltip = d3.select(".tooltip-black");
    if (tooltip.empty()) tooltip = d3.select("body").append("div").attr("class", "tooltip-black");

    bars.on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 1).attr("stroke", "#000").attr("stroke-width", 1.5);
        const color = d.gender === "Female" ? "#d32f2f" : "#2980b9";
        tooltip.style("opacity", 1).style("color", color).style("border-color", color)
            .html(`${d.gender.toUpperCase()}<br/>RATE: ${d.val.toFixed(1)}%`)
            .style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
    }).on("mouseout", function() {
        d3.select(this).attr("opacity", 0.9).attr("stroke", "none");
        tooltip.style("opacity", 0);
    });
}

function init() {
    fetch("gender-raw-2021.csv")
        .then(response => response.text())
        .then(rawText => {
            const dataText = rawText.split('\n').slice(4).join('\n');
            globalData = d3.csvParse(dataText);

            const ALL_COUNTRIES = Array.from(new Set(globalData.map(d => d['Country Name'])));
            let minYear = 2020;
            let maxYear = 2010;

            for (let y = 2010; y <= 2019; y++) {
                const yearStr = y.toString();
                let validCountriesForYear = [];

                ALL_COUNTRIES.forEach(country => {
                    const rows = globalData.filter(d => d['Country Name'] === country);
                    
                    const hasEdu = rows.find(d => d['Indicator Name'] === IND_SEC_M && d[yearStr] !== undefined && d[yearStr].trim() !== "");
                    const hasEmp = rows.find(d => d['Indicator Name'] === IND_EMP_M && d[yearStr] !== undefined && d[yearStr].trim() !== "");

                    if (hasEdu && hasEmp) {
                        validCountriesForYear.push({ name: country, code: rows[0]['Country Code'] });
                    }
                });

                if (validCountriesForYear.length > 0) {
                    validDataMap[yearStr] = validCountriesForYear.sort((a,b) => a.name.localeCompare(b.name));
                    if (y < minYear) minYear = y;
                    if (y > maxYear) maxYear = y;
                }
            }

            d3.selectAll("input[type=range]")
                .attr("min", minYear).attr("max", maxYear).property("value", maxYear);

            d3.select("#white-year-label").text(maxYear);
            d3.select("#black-year-label").text(maxYear);

            const updateDropdown = (year) => {
                const select = d3.select("#white-country");
                select.selectAll("option").remove(); 
                
                const validList = validDataMap[year] || [];
                validList.forEach(c => {
                    select.append("option").attr("value", c.code).text(c.name);
                });
                
                const worldObj = validList.find(c => c.name === "World");
                const defaultCode = worldObj ? worldObj.code : (validList[0] ? validList[0].code : "");
                select.property("value", defaultCode);
                return defaultCode;
            };

            const initialCode = updateDropdown(maxYear.toString());
            if (initialCode) {
                updateWhiteHatVisuals(initialCode, maxYear.toString());
            }
            createBlackHatVis(maxYear.toString());

            // --- EVENT LISTENERS ---
            d3.select("#white-slider").on("input", function() {
                const selectedYear = this.value;
                d3.select("#white-year-label").text(selectedYear);
                const newValidCode = updateDropdown(selectedYear);
                if(newValidCode) updateWhiteHatVisuals(newValidCode, selectedYear);
            });

            d3.select("#white-country").on("change", function() {
                const year = d3.select("#white-slider").property("value");
                updateWhiteHatVisuals(this.value, year);
            });

            d3.select("#black-slider").on("input", function() {
                d3.select("#black-year-label").text(this.value);
                createBlackHatVis(this.value);
            });

            d3.select("#reset-zoom-btn").on("click", function() {
                zoomBehaviors.forEach(zb => {
                    zb.svg.transition().duration(500).call(zb.zoom.transform, d3.zoomIdentity);
                });
            });
        });
}

window.addEventListener('load', init);