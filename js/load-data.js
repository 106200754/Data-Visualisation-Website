const svg = d3.select(".responsive-svg-container")
    .append("svg")
      .attr("viewBox", "0 0 500 500")
      .attr("width", 300)
      .attr("height", 300)
      .style("border", "1px solid black");

d3.csv("../data/", d => ({


})).then(data => {

    console.log(data);

}).catch(error => {
    console.error("Error loading the CSV file:", error);
});