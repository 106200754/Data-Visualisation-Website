// Load data, fill KPIs, draw charts, redraw on resize.
// File and column names match the team's CSVs in /data.
let DATA = {};

const yearRow = d => ({ year: +d.Year, hospitalisations: +d.Hospitalisations });

(async function init() {
  try {
    const [national, firstNations, group, byState] = await Promise.all([
      d3.csv("data/national_hospitalisations_2011_2021.csv", yearRow),
      d3.csv("data/first_nations_yearly_2011_2021.csv", yearRow),
      d3.csv("data/selected_group_percentage_change_2011_2021.csv",
        d => ({ label: d.Group, change: +d.PercentageChange / 100, order: +d.Order })),
      d3.csv("data/state_territory_hospitalisations_2021.csv",
        d => ({ state: d.State, hospitalisations: +d.Hospitalisations })),
    ]);
    group.sort((a, b) => a.order - b.order);
    DATA = { national, firstNations, group, byState };

    const last = national[national.length - 1];
    const lastFn = firstNations[firstNations.length - 1];
    d3.select("#header-year").text(last.year);
    d3.select("#kpi-national-label").text(`Hospitalised injuries, ${last.year}`);
    d3.select("#kpi-national").text(fmt(last.hospitalisations));
    d3.select("#kpi-firstnations-label").text(`First Nations hospitalised injuries, ${lastFn.year}`);
    d3.select("#kpi-firstnations").text(fmt(lastFn.hospitalisations));

    drawAll();

    let t;
    window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(drawAll, 150); });
  } catch (err) {
    console.error("Failed to load data. Run a local server (e.g. VS Code Live Server).", err);
    d3.selectAll(".chart").append("p").text("Could not load data. Check the data/ folder and run a local server.");
  }
})();

function drawAll() {
  renderLine("#chart-national", DATA.national, "var(--c-main)");
  renderLine("#chart-firstnations", DATA.firstNations, "var(--coral)");
  renderChange("#chart-group", DATA.group, 2011, 2021, true);   // keep the CSV "Order"
  renderBars("#chart-state", DATA.byState);
}