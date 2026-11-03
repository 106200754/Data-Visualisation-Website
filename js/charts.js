// All charts. Colours come from CSS variables so they follow the light/dark theme.

// Line + area chart. rows: { year, hospitalisations }
function renderLine(selector, rows, color = "var(--c-main)") {
  const { g, innerW, innerH } = createSvg(selector);
  const x = d3.scaleLinear().domain(d3.extent(rows, d => d.year)).range([0, innerW]);
  const y = d3.scaleLinear().domain([0, d3.max(rows, d => d.hospitalisations) * 1.1]).nice().range([innerH, 0]);

  g.append("g").attr("class", "grid-lines").call(d3.axisLeft(y).ticks(4).tickSize(-innerW).tickFormat(""));
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(Math.min(rows.length, 11)));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(4).tickFormat(fmt));

  g.append("path").datum(rows).attr("fill", color).attr("opacity", .12)
    .attr("d", d3.area().x(d => x(d.year)).y0(innerH).y1(d => y(d.hospitalisations)));
  g.append("path").datum(rows).attr("fill", "none").attr("stroke", color).attr("stroke-width", 2.5)
    .attr("d", d3.line().x(d => x(d.year)).y(d => y(d.hospitalisations)));

  g.selectAll("circle").data(rows).join("circle")
    .attr("cx", d => x(d.year)).attr("cy", d => y(d.hospitalisations))
    .attr("r", (d, i) => i === rows.length - 1 ? 6 : 4).attr("fill", color)
    .on("mousemove", (e, d) => showTooltip(e, `<strong>${d.year}</strong><br>${fmt(d.hospitalisations)} hospitalisations`))
    .on("mouseleave", hideTooltip);
  // TODO: annotate the 2020 dip, peak/low markers
}

// Horizontal diverging bars of % change. rows: { label, change, start?, end? }  (change as a fraction, 0.51 = +51%)
function renderChange(selector, rows, startYear, endYear, keepOrder = false) {
  const { g, innerW, innerH } = createSvg(selector, { top: 8, right: 56, bottom: 28, left: 110 });
  if (!keepOrder) rows = [...rows].sort((a, b) => b.change - a.change);
  const x = d3.scaleLinear().domain(d3.extent([0, ...rows.map(r => r.change)])).nice().range([0, innerW]);
  const y = d3.scaleBand().domain(rows.map(r => r.label)).range([0, innerH]).padding(.25);

  g.append("g").attr("class", "axis").attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(4).tickFormat(d3.format("+.0%")));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();

  g.selectAll("rect").data(rows).join("rect")
    .attr("x", d => x(Math.min(0, d.change))).attr("y", d => y(d.label))
    .attr("width", d => Math.abs(x(d.change) - x(0))).attr("height", y.bandwidth()).attr("rx", 4)
    .attr("fill", d => d.change >= 0 ? "var(--coral)" : "var(--sky)")
    .on("mousemove", (e, d) => showTooltip(e, d.start == null
      ? `<strong>${d.label}</strong><br>Change ${startYear}\u2013${endYear}: ${fmtPct(d.change)}`
      : `<strong>${d.label}</strong><br>${startYear}: ${fmt(d.start)}<br>${endYear}: ${fmt(d.end)}<br>Change: ${fmtPct(d.change)}`))
    .on("mouseleave", hideTooltip);

  g.selectAll(".val-label").data(rows).join("text").attr("class", "val-label")
    .attr("x", d => d.change >= 0 ? x(d.change) + 5 : x(d.change) - 5)
    .attr("text-anchor", d => d.change >= 0 ? "start" : "end")
    .attr("y", d => y(d.label) + y.bandwidth() / 2).attr("dy", "0.35em")
    .text(d => fmtPct(d.change));
}

// Horizontal bars. rows: { state, hospitalisations }
function renderBars(selector, rows) {
  const { g, innerW, innerH } = createSvg(selector, { top: 8, right: 60, bottom: 24, left: 44 });
  rows = [...rows].sort((a, b) => b.hospitalisations - a.hospitalisations);
  const x = d3.scaleLinear().domain([0, d3.max(rows, d => d.hospitalisations)]).nice().range([0, innerW]);
  const y = d3.scaleBand().domain(rows.map(r => r.state)).range([0, innerH]).padding(.22);

  g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickSize(0)).select(".domain").remove();
  g.selectAll("rect").data(rows).join("rect")
    .attr("x", 0).attr("y", d => y(d.state)).attr("width", d => x(d.hospitalisations)).attr("height", y.bandwidth())
    .attr("rx", 4).attr("fill", "var(--c-main)")
    .on("mousemove", (e, d) => showTooltip(e, `<strong>${d.state}</strong><br>${fmt(d.hospitalisations)} hospitalisations`))
    .on("mouseleave", hideTooltip);
  g.selectAll(".val-label").data(rows).join("text").attr("class", "val-label")
    .attr("x", d => x(d.hospitalisations) + 5).attr("y", d => y(d.state) + y.bandwidth() / 2).attr("dy", "0.35em")
    .text(d => fmt(d.hospitalisations));
}