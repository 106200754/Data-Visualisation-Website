// Shared helpers
const fmt = d3.format(",");
const fmtPct = d3.format("+.1%");
const tooltip = d3.select("#tooltip");

function showTooltip(event, html) {
  tooltip.html(html).style("opacity", 1).attr("aria-hidden", "false")
    .style("left", Math.min(event.clientX + 14, window.innerWidth - 230) + "px")
    .style("top", event.clientY + 14 + "px");
}
function hideTooltip() { tooltip.style("opacity", 0).attr("aria-hidden", "true"); }

// Create an SVG that fills its container (re-draw on resize)
function createSvg(selector, margin = { top: 16, right: 24, bottom: 30, left: 56 }) {
  const el = document.querySelector(selector);
  const width = Math.max(el.clientWidth, 260);
  const height = Math.max(el.clientHeight, 180);
  const container = d3.select(selector);
  container.selectAll("*").remove();
  const svg = container.append("svg").attr("width", width).attr("height", height);
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  return { svg, g, innerW: width - margin.left - margin.right, innerH: height - margin.top - margin.bottom };
}