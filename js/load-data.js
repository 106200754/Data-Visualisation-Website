d3.csv("../data/first_nations_yearly_2011_2021.csv", d => ({
    year: +d.Year,
    hospitalisations: +d.Hospitalisations
})).then(data => {
    console.log(data);
}).catch(error => {
    console.error("Error loading the CSV file:", error);
});


d3.csv("../data/national_hospitalisations_2011_2021.csv", d => ({
    year: +d.Year,
    hospitalisations: +d.Hospitalisations
})).then(data => {
    console.log(data);
}).catch(error => {
    console.error("Error loading the CSV file:", error);
});


d3.csv("../data/selected_group_percentage_change_2011_2021.csv", d => ({
    group: d.Group,
    percentage: +d.PercentageChange,
    order: +d.Order
})).then(data => {
    console.log(data);
}).catch(error => {
    console.error("Error loading the CSV file:", error);
});


d3.csv("../data/state_territory_hospitalisations_2021.csv", d => ({
    state: d.State,
    hospitalisations: +d.Hospitalisations
})).then(data => {
    console.log(data);
}).catch(error => {
    console.error("Error loading the CSV file:", error);
});