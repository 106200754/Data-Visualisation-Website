/*
  Group 18 interactive D3 dashboard.
  GenAI acknowledgement: Generative AI was used to review chart structure,
  interaction logic and accessibility. The team reviewed and adapted the code
  and remains responsible for the submitted implementation.
*/

(function () {
  "use strict";

  const colours = {
    pine: "#1c4c44",
    pineDark: "#091f1c",
    mint: "#72d5b1",
    coral: "#ff6a55",
    sky: "#84b5e9",
    muted: "#9db0aa",
    pale: "#dce7e3",
    panel: "#fbfdfc"
  };

  const formatNumber = d3.format(",");
  const formatPercent = d3.format("+.1f");
  const tooltip = d3.select("#chart-tooltip");
  const state = {
    yearRange: [2011, 2021],
    selectedGroup: null,
    selectedState: null
  };

  let nationalData = [];
  let firstNationsData = [];
  let groupData = [];
  let stateData = [];
  let brushController = null;
  let updateNationalSelection = function () {};
  let updateIndexedSelection = function () {};
  let updateRadialSelection = function () {};
  let updateStateSelection = function () {};

  Promise.all([
    d3.csv("data/national_hospitalisations_2011_2021.csv", d => ({
      year: +d.Year,
      hospitalisations: +d.Hospitalisations
    })),
    d3.csv("data/first_nations_yearly_2011_2021.csv", d => ({
      year: +d.Year,
      hospitalisations: +d.Hospitalisations
    })),
    d3.csv("data/selected_group_percentage_change_2011_2021.csv", d => ({
      group: d.Group,
      percentage: +d.PercentageChange,
      order: +d.Order
    })),
    d3.csv("data/state_territory_hospitalisations_2021.csv", d => ({
      state: d.State,
      hospitalisations: +d.Hospitalisations
    }))
  ]).then(([national, firstNations, groups, states]) => {
    nationalData = national.sort((a, b) => d3.ascending(a.year, b.year));
    firstNationsData = firstNations.sort((a, b) => d3.ascending(a.year, b.year));
    groupData = groups.sort((a, b) => d3.descending(a.percentage, b.percentage));
    stateData = states.sort((a, b) => d3.descending(a.hospitalisations, b.hospitalisations));

    drawNationalChart();
    drawIndexedChart();
    drawRadialChart();
    drawPackedCircleChart();
    attachDashboardControls();
    applyStory("rise");
  }).catch(error => {
    console.error("Dashboard data could not be loaded:", error);
    d3.selectAll(".chart-placeholder")
      .html("<strong>Chart unavailable</strong><small>Please check that the cleaned CSV files are present.</small>");
  });

  function createSvg(selector, accessibleLabel) {
    const container = d3.select(selector)
      .classed("chart-ready", true)
      .html("");

    return container.append("svg")
      .attr("viewBox", "0 0 640 240")
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("role", "img")
      .attr("aria-label", accessibleLabel);
  }

  function showTooltip(event, html) {
    tooltip
      .html(html)
      .style("left", `${Math.min(event.clientX + 12, window.innerWidth - 245)}px`)
      .style("top", `${Math.max(event.clientY - 36, 8)}px`)
      .classed("is-visible", true);
  }

  function hideTooltip() {
    tooltip.classed("is-visible", false);
  }

  function enableKeyboardSelection(selection, callback) {
    selection
      .attr("tabindex", 0)
      .on("keydown", function (event, d) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          callback(d);
        }
      });
  }

  function drawNationalChart() {
    const svg = createSvg(
      "#chart-national",
      "National hospitalisations from 2011 to 2021. Drag the brush below the line to select a year range."
    );
    const width = 640;
    const margin = { top: 17, right: 20, bottom: 62, left: 52 };
    const plotBottom = 157;
    const x = d3.scaleLinear()
      .domain(d3.extent(nationalData, d => d.year))
      .range([margin.left, width - margin.right]);
    const yExtent = d3.extent(nationalData, d => d.hospitalisations);
    const y = d3.scaleLinear()
      .domain([Math.floor((yExtent[0] - 800) / 1000) * 1000, Math.ceil((yExtent[1] + 500) / 1000) * 1000])
      .nice()
      .range([plotBottom, margin.top]);

    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(3).tickSize(-(width - margin.left - margin.right)).tickFormat(""));

    svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${plotBottom})`)
      .call(d3.axisBottom(x).tickValues([2011, 2013, 2015, 2017, 2019, 2021]).tickFormat(d3.format("d")));

    svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(3).tickFormat(d3.format("~s")));

    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.hospitalisations))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(nationalData)
      .attr("class", "line-muted")
      .attr("d", line);

    const clipId = "national-selection-clip";
    const clipRect = svg.append("defs")
      .append("clipPath")
      .attr("id", clipId)
      .append("rect")
      .attr("y", 0)
      .attr("height", plotBottom + 10);

    svg.append("path")
      .datum(nationalData)
      .attr("class", "line-selected")
      .attr("clip-path", `url(#${clipId})`)
      .attr("d", line);

    const points = svg.append("g")
      .selectAll("circle")
      .data(nationalData)
      .join("circle")
      .attr("class", "data-point")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.hospitalisations))
      .attr("r", 4.2)
      .attr("aria-label", d => `${d.year}: ${formatNumber(d.hospitalisations)} hospitalisations`)
      .on("pointerenter", (event, d) => showTooltip(
        event,
        `<strong>${d.year}</strong><br>${formatNumber(d.hospitalisations)} hospitalisations`
      ))
      .on("pointerleave", hideTooltip);

    points.append("title")
      .text(d => `${d.year}: ${formatNumber(d.hospitalisations)} hospitalisations`);

    const year2020 = nationalData.find(d => d.year === 2020);
    svg.append("line")
      .attr("class", "annotation-line")
      .attr("x1", x(2020))
      .attr("x2", x(2020))
      .attr("y1", y(year2020.hospitalisations) - 27)
      .attr("y2", y(year2020.hospitalisations) - 7);
    svg.append("text")
      .attr("class", "annotation-text")
      .attr("x", x(2020))
      .attr("y", y(year2020.hospitalisations) - 31)
      .attr("text-anchor", "middle")
      .text("2020 decline");

    const contextY = d3.scaleLinear()
      .domain(y.domain())
      .range([222, 187]);
    const contextLine = d3.line()
      .x(d => x(d.year))
      .y(d => contextY(d.hospitalisations))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(nationalData)
      .attr("d", contextLine)
      .attr("fill", "none")
      .attr("stroke", colours.muted)
      .attr("stroke-width", 1.4);

    svg.append("text")
      .attr("class", "guide-label")
      .attr("x", margin.left)
      .attr("y", 181)
      .text("Drag to choose years");

    const brush = d3.brushX()
      .extent([[margin.left, 184], [width - margin.right, 225]])
      .on("brush", brushed)
      .on("end", brushEnded);
    const brushGroup = svg.append("g")
      .attr("class", "brush")
      .call(brush);

    function selectionToYears(selection) {
      if (!selection) return [2011, 2021];
      const start = Math.max(2011, Math.min(2021, Math.round(x.invert(selection[0]))));
      const end = Math.max(start, Math.min(2021, Math.round(x.invert(selection[1]))));
      return [start, end];
    }

    function brushed(event) {
      setYearRange(selectionToYears(event.selection), true);
    }

    function brushEnded(event) {
      if (!event.selection) {
        brushGroup.call(brush.move, [x(2011), x(2021)]);
        return;
      }
      const range = selectionToYears(event.selection);
      if (event.sourceEvent) {
        brushGroup.transition().duration(160).call(brush.move, range.map(x));
      }
    }

    brushController = range => brushGroup.call(brush.move, range.map(x));
    updateNationalSelection = () => {
      const [start, end] = state.yearRange;
      clipRect
        .attr("x", x(start) - 5)
        .attr("width", Math.max(10, x(end) - x(start) + 10));
      points
        .attr("fill", d => d.year >= start && d.year <= end ? colours.coral : colours.muted)
        .attr("opacity", d => d.year >= start && d.year <= end ? 1 : .34);
    };

    brushController(state.yearRange);
  }

  function drawIndexedChart() {
    const svg = createSvg(
      "#chart-firstnations",
      "Indexed hospitalisation growth. Both national and First Nations series begin at 100 in 2011."
    );
    const width = 640;
    const height = 240;
    const margin = { top: 35, right: 55, bottom: 35, left: 48 };
    const nationalBase = nationalData[0].hospitalisations;
    const firstBase = firstNationsData[0].hospitalisations;
    const series = [
      {
        key: "National",
        colour: colours.sky,
        css: "line-national-index",
        values: nationalData.map(d => ({ ...d, index: d.hospitalisations / nationalBase * 100 }))
      },
      {
        key: "First Nations",
        colour: colours.coral,
        css: "line-first",
        values: firstNationsData.map(d => ({ ...d, index: d.hospitalisations / firstBase * 100 }))
      }
    ];

    const x = d3.scaleLinear().domain([2011, 2021]).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([90, 205]).range([height - margin.bottom, margin.top]);

    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickValues([100, 150, 200]).tickSize(-(width - margin.left - margin.right)).tickFormat(""));
    svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickValues([2011, 2013, 2015, 2017, 2019, 2021]).tickFormat(d3.format("d")));
    svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickValues([100, 150, 200]).tickFormat(d => `${d}`));

    const selectionWindow = svg.insert("rect", ":first-child")
      .attr("class", "selection-window")
      .attr("y", margin.top)
      .attr("height", height - margin.top - margin.bottom);

    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.index))
      .curve(d3.curveMonotoneX);

    series.forEach((item, seriesIndex) => {
      svg.append("path")
        .datum(item.values)
        .attr("class", item.css)
        .attr("d", line);

      const points = svg.append("g")
        .attr("data-index-series", seriesIndex)
        .selectAll("circle")
        .data(item.values)
        .join("circle")
        .attr("class", "data-point indexed-point")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.index))
        .attr("r", 3.5)
        .attr("fill", item.colour)
        .attr("aria-label", d => `${item.key}, ${d.year}: index ${d.index.toFixed(1)}, ${formatNumber(d.hospitalisations)} hospitalisations`)
        .on("pointerenter", (event, d) => showTooltip(
          event,
          `<strong>${item.key} · ${d.year}</strong><br>Index ${d.index.toFixed(1)}<br>${formatNumber(d.hospitalisations)} hospitalisations`
        ))
        .on("pointerleave", hideTooltip);
      points.append("title")
        .text(d => `${item.key}, ${d.year}: index ${d.index.toFixed(1)}`);
    });

    const legend = svg.append("g").attr("transform", `translate(${margin.left},13)`);
    series.forEach((item, index) => {
      const group = legend.append("g").attr("transform", `translate(${index * 145},0)`);
      group.append("line").attr("x2", 22).attr("y1", 4).attr("y2", 4).attr("stroke", item.colour).attr("stroke-width", 3);
      group.append("text").attr("class", "legend-label").attr("x", 28).attr("y", 8).text(item.key);
    });
    svg.append("text")
      .attr("class", "guide-label")
      .attr("x", margin.left + 4)
      .attr("y", y(100) - 5)
      .text("2011 baseline");

    updateIndexedSelection = () => {
      const [start, end] = state.yearRange;
      selectionWindow
        .attr("x", x(start))
        .attr("width", Math.max(5, x(end) - x(start)));
      svg.selectAll(".indexed-point")
        .attr("opacity", d => d.year >= start && d.year <= end ? 1 : .22);
    };
    updateIndexedSelection();
  }

  function drawRadialChart() {
    const svg = createSvg(
      "#chart-group",
      "Radial bars compare percentage changes for five selected age and road-user groups from 2011 to 2021."
    );
    const centreX = 166;
    const centreY = 120;
    const innerRadius = 35;
    const radius = d3.scaleLinear().domain([0, 60]).range([innerRadius, 105]);
    const angleStep = Math.PI * 2 / groupData.length;

    [20, 40, 60].forEach(value => {
      svg.append("circle")
        .attr("cx", centreX)
        .attr("cy", centreY)
        .attr("r", radius(value))
        .attr("fill", "none")
        .attr("stroke", colours.pale)
        .attr("stroke-dasharray", "2 3");
      svg.append("text")
        .attr("class", "guide-label")
        .attr("x", centreX + 3)
        .attr("y", centreY - radius(value) + 10)
        .text(`${value}%`);
    });

    const colourForGroup = d => d.group.includes("age") ? colours.sky : colours.mint;
    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(d => radius(d.percentage))
      .startAngle((d, i) => i * angleStep - Math.PI / 2 + .07)
      .endAngle((d, i) => (i + 1) * angleStep - Math.PI / 2 - .07)
      .cornerRadius(4);

    const arcs = svg.append("g")
      .attr("transform", `translate(${centreX},${centreY})`)
      .selectAll("path")
      .data(groupData)
      .join("path")
      .attr("class", "radial-arc")
      .attr("d", arc)
      .attr("fill", colourForGroup)
      .attr("stroke", colours.panel)
      .attr("stroke-width", 1.5)
      .attr("aria-label", d => `${d.group}: ${d.percentage.toFixed(1)} percent increase`)
      .on("pointerenter", (event, d) => showTooltip(
        event,
        `<strong>${d.group}</strong><br>${d.percentage.toFixed(1)}% increase from 2011 to 2021`
      ))
      .on("pointerleave", hideTooltip)
      .on("click", (event, d) => selectGroup(d));
    enableKeyboardSelection(arcs, selectGroup);
    arcs.append("title").text(d => `${d.group}: ${d.percentage.toFixed(1)}% increase`);

    const centreValue = svg.append("text")
      .attr("x", centreX)
      .attr("y", centreY - 2)
      .attr("text-anchor", "middle")
      .attr("fill", colours.pineDark)
      .attr("font-family", "Bricolage Grotesque, sans-serif")
      .attr("font-size", 18)
      .attr("font-weight", 800)
      .text("5 groups");
    const centreLabel = svg.append("text")
      .attr("x", centreX)
      .attr("y", centreY + 15)
      .attr("text-anchor", "middle")
      .attr("class", "guide-label")
      .text("2011 → 2021");

    const legendRows = svg.append("g")
      .attr("transform", "translate(320,26)")
      .selectAll("g")
      .data(groupData)
      .join("g")
      .attr("class", "radial-legend-row")
      .attr("transform", (d, i) => `translate(0,${i * 39})`)
      .attr("role", "button")
      .attr("aria-label", d => `Select ${d.group}`)
      .on("click", (event, d) => selectGroup(d));
    enableKeyboardSelection(legendRows, selectGroup);
    legendRows.append("rect")
      .attr("width", 8)
      .attr("height", 24)
      .attr("rx", 4)
      .attr("fill", colourForGroup);
    legendRows.append("text")
      .attr("class", "legend-label")
      .attr("x", 16)
      .attr("y", 10)
      .text(d => d.group);
    legendRows.append("text")
      .attr("x", 16)
      .attr("y", 23)
      .attr("fill", colours.coral)
      .attr("font-size", 11)
      .attr("font-weight", 700)
      .text(d => `+${d.percentage.toFixed(1)}%`);

    updateRadialSelection = () => {
      const selected = state.selectedGroup;
      arcs
        .classed("is-selected", d => selected === d.group)
        .classed("is-muted", d => selected && selected !== d.group);
      legendRows
        .classed("is-selected", d => selected === d.group)
        .classed("is-muted", d => selected && selected !== d.group);

      const selectedDatum = groupData.find(d => d.group === selected);
      centreValue.text(selectedDatum ? `+${selectedDatum.percentage.toFixed(1)}%` : "5 groups");
      centreLabel.text(selectedDatum ? shortGroupName(selectedDatum.group) : "2011 → 2021");
    };
    updateRadialSelection();
  }

  function drawPackedCircleChart() {
    const svg = createSvg(
      "#chart-state",
      "Packed circles compare 2021 hospitalisation counts across Australian states and territories."
    );
    const root = d3.hierarchy({ children: stateData })
      .sum(d => d.hospitalisations || 0)
      .sort((a, b) => b.value - a.value);
    const packed = d3.pack().size([600, 222]).padding(5)(root);
    const maxValue = d3.max(stateData, d => d.hospitalisations);
    const fill = d3.scaleLinear()
      .domain([0, maxValue])
      .range(["#cdece1", colours.pine]);

    const nodes = svg.append("g")
      .attr("transform", "translate(20,9)")
      .selectAll("g")
      .data(packed.leaves())
      .join("g")
      .attr("class", "state-node")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .attr("role", "button")
      .attr("aria-label", d => `${d.data.state}: ${formatNumber(d.data.hospitalisations)} hospitalisations in 2021`)
      .on("pointerenter", (event, d) => showTooltip(
        event,
        `<strong>${d.data.state} · 2021</strong><br>${formatNumber(d.data.hospitalisations)} hospitalisations<br><small>Counts are not population-adjusted.</small>`
      ))
      .on("pointerleave", hideTooltip)
      .on("click", (event, d) => selectState(d.data));
    enableKeyboardSelection(nodes, d => selectState(d.data));

    nodes.append("circle")
      .attr("r", d => d.r)
      .attr("fill", d => fill(d.data.hospitalisations))
      .attr("stroke", colours.panel)
      .attr("stroke-width", 2);
    nodes.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.r > 32 ? "-0.15em" : ".3em")
      .attr("fill", d => d.data.hospitalisations > maxValue * .42 ? colours.panel : colours.pineDark)
      .attr("font-family", "Bricolage Grotesque, sans-serif")
      .attr("font-size", d => Math.max(10, Math.min(18, d.r / 2.7)))
      .attr("font-weight", 800)
      .text(d => d.data.state);
    nodes.filter(d => d.r > 32)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.15em")
      .attr("fill", d => d.data.hospitalisations > maxValue * .42 ? "#cfe2dc" : colours.pine)
      .attr("font-size", 9)
      .text(d => formatNumber(d.data.hospitalisations));
    nodes.append("title")
      .text(d => `${d.data.state}: ${formatNumber(d.data.hospitalisations)} hospitalisations`);

    updateStateSelection = () => {
      const selected = state.selectedState;
      nodes
        .classed("is-selected", d => selected === d.data.state)
        .classed("is-muted", d => selected && selected !== d.data.state);
    };
    updateStateSelection();
  }

  function setYearRange(range, fromBrush) {
    state.yearRange = range;
    updateNationalSelection();
    updateIndexedSelection();
    updateKpis();

    if (fromBrush) {
      clearStoryFocus();
      setActiveStoryButton(null);
      const start = nationalData.find(d => d.year === range[0]);
      const end = nationalData.find(d => d.year === range[1]);
      const change = (end.hospitalisations - start.hospitalisations) / start.hospitalisations * 100;
      setStoryText(
        "Custom year selection",
        `${range[0]}–${range[1]}: national hospitalisations changed by ${formatPercent(change)}%.`
      );
    }
  }

  function updateKpis() {
    const [startYear, endYear] = state.yearRange;
    const nationalStart = nationalData.find(d => d.year === startYear);
    const nationalEnd = nationalData.find(d => d.year === endYear);
    const firstEnd = firstNationsData.find(d => d.year === endYear);
    const change = (nationalEnd.hospitalisations - nationalStart.hospitalisations) / nationalStart.hospitalisations * 100;

    d3.select(".year-range").text(startYear === endYear ? `${endYear}` : `${startYear}—${endYear}`);
    d3.select("#kpi-national-label").text(`Hospitalisations · ${endYear}`);
    d3.select("#kpi-national-value").text(formatNumber(nationalEnd.hospitalisations));
    d3.select("#kpi-change-label").text(`National change · ${String(startYear).slice(2)}–${String(endYear).slice(2)}`);
    d3.select("#kpi-change-value").text(`${formatPercent(change)}%`);
    d3.select("#kpi-first-label").text(`First Nations · ${endYear}`);
    d3.select("#kpi-first-value").text(formatNumber(firstEnd.hospitalisations));
  }

  function selectGroup(datum, keepStoryText) {
    state.selectedState = null;
    updateStateSelection();
    state.selectedGroup = state.selectedGroup === datum.group ? null : datum.group;
    updateRadialSelection();
    focusCard(state.selectedGroup ? "groups" : null);
    setActiveStoryButton(null);
    if (!keepStoryText) {
      if (state.selectedGroup) {
        setStoryText(
          "Selected group",
          `${datum.group} recorded a ${datum.percentage.toFixed(1)}% increase between 2011 and 2021.`
        );
      } else {
        applyStory("rise");
      }
    }
  }

  function selectState(datum) {
    state.selectedGroup = null;
    updateRadialSelection();
    state.selectedState = state.selectedState === datum.state ? null : datum.state;
    updateStateSelection();
    focusCard(state.selectedState ? "states" : null);
    setActiveStoryButton(null);
    if (state.selectedState) {
      setStoryText(
        "Selected jurisdiction · 2021",
        `${datum.state} recorded ${formatNumber(datum.hospitalisations)} hospitalisations. This is an absolute count, not a population-adjusted risk.`
      );
    } else {
      applyStory("rise");
    }
  }

  function attachDashboardControls() {
    d3.selectAll(".story-button").on("click", function () {
      applyStory(this.dataset.story);
    });
    d3.select("#reset-dashboard").on("click", resetDashboard);
  }

  function resetDashboard() {
    state.selectedGroup = null;
    state.selectedState = null;
    updateRadialSelection();
    updateStateSelection();
    if (brushController) brushController([2011, 2021]);
    else setYearRange([2011, 2021], false);
    setStoryText(
      "National snapshot",
      "Explore the four views, drag the year brush, or choose a guided story above. Counts are not population-adjusted."
    );
    focusCard(null);
    setActiveStoryButton(null);
  }

  function applyStory(story) {
    state.selectedGroup = null;
    state.selectedState = null;
    updateRadialSelection();
    updateStateSelection();

    const stories = {
      rise: {
        range: [2011, 2021],
        focus: "national",
        title: "Story 1 of 4 · National rise",
        message: "Hospitalisations increased overall from 2011 to 2021, despite a temporary decline in 2020."
      },
      interruption: {
        range: [2019, 2021],
        focus: "national",
        title: "Story 2 of 4 · The 2020 interruption",
        message: "The national count fell in 2020 before rising again in 2021. Drag the brush to inspect another period."
      },
      "first-nations": {
        range: [2011, 2021],
        focus: "first-nations",
        title: "Story 3 of 4 · Uneven growth",
        message: "First Nations hospitalisations increased by about 90.2%, compared with 16.1% nationally."
      },
      groups: {
        range: [2011, 2021],
        focus: "groups",
        title: "Story 4 of 4 · Groups changing fastest",
        message: "People aged 65–74 and pedal cyclists recorded the largest increases among the selected groups."
      }
    };
    const selectedStory = stories[story];
    if (brushController) brushController(selectedStory.range);
    else setYearRange(selectedStory.range, false);

    if (story === "groups") {
      state.selectedGroup = groupData[0].group;
      updateRadialSelection();
    }
    setStoryText(selectedStory.title, selectedStory.message);
    focusCard(selectedStory.focus);
    setActiveStoryButton(story);
  }

  function setStoryText(title, message) {
    d3.select("#story-title").text(title);
    d3.select("#story-message").text(message);
  }

  function setActiveStoryButton(story) {
    d3.selectAll(".story-button")
      .classed("is-active", function () { return this.dataset.story === story; });
  }

  function focusCard(cardId) {
    d3.selectAll(".chart-card")
      .classed("story-focus", function () { return cardId && this.id === cardId; })
      .classed("story-muted", function () { return cardId && this.id !== cardId; });
  }

  function clearStoryFocus() {
    focusCard(null);
  }

  function shortGroupName(group) {
    return group
      .replace(" age group", "")
      .replace("Pedal cyclist", "Cyclist")
      .replace("Motorcyclist", "Motorcycle");
  }
})();
