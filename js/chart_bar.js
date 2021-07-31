function loadChart2(olympicId) {
    // Get current browser window dimensions
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        x_size = w.innerWidth || e.clientWidth || g.clientWidth;

    let svg;

    // Read the data
    d3.csv(dataPath, function(error, data) {
        if (error) throw error;

        // Calculate the maximum number of medals and participating continents throughout the Olympics
        var medals_max = getMaxMedals(data);
        var continents = getContinentsList(data);

        var allCountries = data.length;

        // filter and sort data
        data = data.filter(function(d) {
            return (computeTotalCumulativeMedails(d, olympicId) !== 0);
        });

        data.sort(function(b, a) {
            return computeTotalCumulativeMedails(a, olympicId) - computeTotalCumulativeMedails(b, olympicId);
        });

        var allActiveCountries = data.length;

        // Set canvas and chart dimensions
        const width = 0.85 * x_size;
        const height = 50 + (allActiveCountries / allCountries) * (olympics ? 500 : 1400);
        const canvas = { width: width, height: height };
        const margin = { left: 65, right: 52, top: 0, bottom: 45 };
        const chart = {
            width: canvas.width - (margin.right + margin.left),
            height: canvas.height - (margin.top + margin.bottom)
        };

        // Append an svg object to the var div
        svg = d3.select("#barDivId")
            .append("svg")
            .attr("width", canvas.width)
            .attr("height", canvas.height)
            .style("background-color", olympics ? '#b3daf117' : '#ffff6f07')
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");


        // Create scale bands for the x axis, bar height (h) and fill color (c)
        var x = d3.scaleLinear()
            .domain([1, medals_max])
            .range([2, chart.width]);
        var y = d3.scaleBand()
            .range([0, chart.height])
            .domain(data.map(function(d) { return d.Country_Code; })).padding(0.15);
        var c = d3.scaleOrdinal()
            .domain(["Europe", "Africa", 'North America', 'South America', "Asia", "Oceania"])
            .range(["#0069b3ff", "#f07d00ff", "#00963fff", "#b70d7fff", "#ffcc01ff", "#e40613ff"]);

        // Add a generic tooltip with 0 opacity
        var tooltip = d3.select("#barDivId")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Create tooltip actions
        var mouseOver = function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.8);

            tooltip.html(getTooltipInfo(d))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 30) + "px");
        };

        var mouseOn = function(d) {
            tooltip.style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 30) + "px");
        };

        var mouseLeave = function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        };

        // Add X and Y axis
        svg.append("g")
            .attr("transform", "translate(0," + chart.height + ")")
            .attr("class", "x axis")
            .transition().delay(3500).duration(1500)
            .call(d3.axisBottom(x))
            .selectAll("text");
        //.attr("transform", "translate(-10,8)rotate(-45)")
        //.style("text-anchor", "middle");

        svg.append("g")
            .attr("class", "y axis")
            .transition().delay(3500).duration(1500)
            .call(d3.axisLeft(y));

        // Add X and Y labels
        svg.append('g')
            .attr('transform', 'translate(' + (chart.width / 2) + ', ' + (chart.height + margin.top + 42) + ')')
            .append('text')
            .style("opacity", 0).transition().delay(3500).duration(2000).style("opacity", 1)
            .attr("class", "x label")
            .attr('text-anchor', 'middle')
            .text("Cumulative medal count");

        svg.append('g')
            .attr('transform', 'translate(' + (-margin.left + 15) + ', ' + (chart.height / 2 + margin.top) + ')')
            .append('text')
            .attr("class", "y label")
            .attr('text-anchor', 'middle')
            .attr("transform", "rotate(-90)")
            .text("Country")
            .style("opacity", 0).transition().delay(3500).duration(2000).style("opacity", 1);

        // Add bars
        var bars = svg.append('g')
            .selectAll("bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", x(0))
            .attr("y", function(d) { return y(d.Country_Code); })
            .attr("width", 0)
            .attr("height", y.bandwidth())
            .style("fill", function(d) { return c(d.Continent); })
            .style("opacity", 0.8);

        // Add lenght transitions
        bars.transition()
            .delay(3750)
            .duration(4000)
            .attr('width', function(d) { return x(computeTotalCumulativeMedails(d, olympicId)); });

        // Add mouse events
        bars.on("mouseover", mouseOver)
            .on("mousemove", mouseOn)
            .on("mouseleave", mouseLeave);

        // Add values at the end of the bars
        svg.append('g')
            .selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "datapoints")
            .attr("x", function(d) { return x(computeTotalCumulativeMedails(d, olympicId)); })
            .attr("y", function(d) { return y(d.Country_Code); })
            .attr("dx", 4)
            .attr("dy", y.bandwidth() / 2)
            .style("alignment-baseline", "central")
            .text(function(d) { return computeTotalCumulativeMedails(d, olympicId); })
            .style("font-size", "9px")
            .style("opacity", 0).transition().delay(6250).duration(2500).style("opacity", 0.8);


        // Add color legend
        var colorLegend = svg.selectAll("colorlegend")
            .data(continents)
            .enter().append("g")
            .attr("class", "colorlegend")
            .attr("transform", function(d, i) {
                return "translate(0," + (5 + 42 * (allActiveCountries / allCountries) + i * 20) + ")";
            });

        colorLegend.append("rect")
            .attr("x", chart.width - y.bandwidth())
            .attr("width", y.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", function(d) { return c(d); })
            .style("stroke-width", 0)
            .on("mouseover", filterContinents)
            .on("mouseout", filterContinentsOff)
            .style("opacity", 0).transition().delay(7000).duration(2000).style("opacity", 0.8);

        colorLegend.append("text")
            .attr("x", chart.width - y.bandwidth() - 10)
            .attr("dy", y.bandwidth() - 1)
            .style("text-anchor", "end")
            .on("mouseover", filterContinents)
            .on("mouseout", filterContinentsOff)
            .text(function(d) { return d; })
            .style("fill-opacity", 0).transition().delay(6750).duration(2000).style("fill-opacity", 0.7);

        // Add annotation text (hint)
        svg.append("text")
            .attr("x", chart.width / 2)
            .attr("y", chart.height / 2)
            .attr("class", "annotation2")
            .style("text-anchor", "middle")
            .text("Cumulative medal count until " + hostCity + " (" + hostYear + ")")
            .style("opacity", 0).transition().delay(5750).duration(3000).style("opacity", 0.3);

    });

    function getPopulation(d) {
        var pop = 0;
        pop += d.Population == "" ? 0 : parseInt(d.Population.replace(/[^\d\.\-eE+]/g, ""));
        pop = Math.round(pop / 1000) / 1000; // convert to milions and round to 3 decimal places
        return pop;
    }

    function getGDPperCapita(d) {
        var gdp = 0;
        gdp += d.GDP_Per_Capita == "" ? 0 : parseInt(d.GDP_Per_Capita.replace(/[^\d\.\-eE+]/g, ""));
        return gdp;
    }

    function getCumulativeMedails(d, untilId) {

        var bronze = 0;
        var gold = 0;
        var silver = 0;

        let bronze_i;
        let gold_i;
        let silver_i;

        const offset = 5; // column number from where the medal columns start
        let index;

        for (let i = 1; i <= untilId; i++) {
            index = offset + 3 * (i - 1);

            bronze_i = d3.values(d)[index];
            gold_i = d3.values(d)[index + 1];
            silver_i = d3.values(d)[index + 2];

            bronze += (isNaN(bronze_i) || bronze_i == "") ? 0 : parseInt(bronze_i);
            gold += (isNaN(gold_i) || gold_i == "") ? 0 : parseInt(gold_i);
            silver += (isNaN(silver_i) || silver_i == "") ? 0 : parseInt(silver_i);
        }
        return { gold, silver, bronze };
    }

    function computeTotalCumulativeMedails(d, untilId) {

        let { gold, silver, bronze } = getCumulativeMedails(d, untilId);
        var tot = 0;

        tot += gold;
        tot += bronze;
        tot += silver;
        return tot;
    }

    function getMaxMedals(data) {
        let medals;
        var maxMedals = 0;

        for (let i = 0; i < data.length; i++) {
            medals = computeTotalCumulativeMedails(data[i], numberOfGames);
            if (maxMedals < medals) {
                maxMedals = medals;
            }
        }
        return maxMedals;
    }

    function getContinentsList(data) {
        const continents = [];

        for (let i = 0; i < data.length; i++) {
            if (computeTotalCumulativeMedails(data[i], olympicId) > 0) {
                if (!continents.includes(data[i].Continent)) {
                    continents.push(data[i].Continent);
                }
            }
        }
        return continents;
    }

    function getTooltipInfo(d) {
        let { gold, silver, bronze } = getCumulativeMedails(d, olympicId);
        let totalMedals = computeTotalCumulativeMedails(d, olympicId);
        let htmlInfo;

        htmlInfo = "<b>Country:</b> " + d.Country + '<br>' +
            "&emsp;&#8226;<b>&emsp;Population:</b> " + d3.format(',.3s')(getPopulation(d) * 1e6).replace(/G/, "B") + '<br>' +
            "&emsp;&#8226;<b>&emsp;GDP per Capita:</b> " + "$" + d3.format(',.3s')(getGDPperCapita(d)) + '<br><br>' +
            "<b>Total cumulative medals:</b> " + totalMedals + '<br>' +
            "&emsp;&#8226;<b>&emsp;Gold medals:</b> " + gold + '<br>' +
            "&emsp;&#8226;<b>&emsp;Silver medals:</b> " + silver + '<br>' +
            "&emsp;&#8226;<b>&emsp;Bronz medals:</b> " + bronze;

        if (d.Country == 'Germany') {
            htmlInfo += '<br><br> * When applicable, West and East Germany<br> have been counted as a single country.';
        }
        return htmlInfo;
    }

    function filterContinents(d) {
        svg.selectAll('.bar')
            .filter(function(data) {
                return (data.Continent != d);
            })
            .transition()
            .style('opacity', 0.05);

        svg.selectAll('.datapoints')
            .filter(function(data) {
                return (data.Continent != d);
            })
            .transition()
            .style('opacity', 0.05);
    }

    function filterContinentsOff(d) {
        svg.selectAll('.bar')
            .transition()
            .style('opacity', 0.8);

        svg.selectAll('.datapoints')
            .transition()
            .style('opacity', 0.8);
    }

}