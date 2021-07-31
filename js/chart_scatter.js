function loadChart1(olympicId) {
    // Get current browser window dimensions
    var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        x_size = w.innerWidth || e.clientWidth || g.clientWidth,
        y_size = w.innerHeight || e.clientHeight || g.clientHeight;

    // Set canvas and chart dimensions
    const width = 0.85 * x_size;
    const height = (0.5 * x_size < 0.62 * y_size) ? 0.5 * x_size : 0.62 * y_size;
    const canvas = { width: width, height: height };
    const margin = { left: 65, right: 52, top: 12, bottom: 36 };
    const chart = {
        width: canvas.width - (margin.right + margin.left),
        height: canvas.height - (margin.top + margin.bottom)
    };

    // Max circle radius (max medails per olympics per country) as a function of chart width and height
    const maxradius = (chart.width + chart.height) / 40;

    // Append an svg object to the scatter div
    var svg = d3.select("#scatterDivId")
        .append("svg")
        .attr("width", canvas.width)
        .attr("height", canvas.height)
        .style("background-color", olympics ? '#b3daf117' : '#ffff6f07')
        //.call(d3.zoom().on("zoom", function() {
        //svg.attr("transform", d3.event.transform)
        //}))
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Read the data
    d3.csv(dataPath, function(error, data) {
        if (error) throw error;

        data = data.filter(
            function(d) {
                return (getPopulation(d) !== 0 && getGDPperCapita(d) !== 0 && computeTotalMedails(d) !== 0);
            }
        )

        // Calculate the extreme values for the selected olympics
        var pop_minmax = getMinMaxPopulation(data);
        var gdp_minmax = getMinMaxGDP(data);
        var medals_max = getMaxMedals(data);
        var continents = getContinentsList(data);

        // Extract and modify the extreme values for the selected olympics
        var pop_min_round = (pop_minmax[0] > 1) ? 1 : 0.1;
        var pop_min = Math.max(0.01, Math.floor(pop_minmax[0] / pop_min_round) * pop_min_round); // min population rounded down to the closest 0.1/1 milion + log protection
        var pop_max = Math.ceil(pop_minmax[1] / 100) * 100; // max population rounded up to the closest 100 milion
        var gdp_min = Math.floor(gdp_minmax[0] / 5000) * 5000; // min GDP per capita rounded down to the closest 5000
        var gdp_max = Math.ceil(gdp_minmax[1] / 10000) * 10000; // max GDP per capita rounded up to the closest 10000

        console.log("Max. population (rounded):", pop_max);
        console.log("Min. population (rounded):", pop_min);
        console.log("Max GDP per capita (rounded):", gdp_max);
        console.log("Min GDP per capita (rounded):", gdp_min);
        console.log("Max medals per country:", medals_max);
        console.log("Continents represented:", continents);

        // Create scale bands for x and y axes, radius (r), and circle fill color (c)
        var x = d3.scaleLog().base(10).domain([pop_min, pop_max]).range([0, chart.width]);
        var y = d3.scaleLinear().domain([gdp_min, gdp_max]).range([chart.height, 0]);
        var r = d3.scaleSqrt().domain([1, medals_max]).range([1.5, maxradius]);
        var c = d3.scaleOrdinal()
            .domain(["Europe", "Africa", 'North America', 'South America', "Asia", "Oceania"])
            .range(["#0069b3ff", "#f07d00ff", "#00963fff", "#b70d7fff", "#ffcc01ff", "#e40613ff"]);

        // Add a generic tooltip with 0 opacity
        var tooltip = d3.select("#scatterDivId")
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
        }

        var mouseOn = function(d) {
            tooltip.style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 30) + "px");
        }

        var mouseLeave = function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        }

        // Add X axis
        var xTickValAll = [0.01, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
        let xTickVal = [];
        for (let i = 0; i < xTickValAll.length; i++) {
            if (xTickValAll[i] >= pop_min && xTickValAll[i] <= pop_max) {
                xTickVal.push(xTickValAll[i]);
            }
        }

        var xAxis = d3.axisBottom(x)
            .tickValues(xTickVal)
            .tickFormat(d3.format('.1r'));

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + chart.height + ")")
            .transition().duration(1500)
            .call(xAxis);

        var yAxis = d3.axisLeft(y)
            .tickFormat(d3.format(',.2r'));

        svg.append("g")
            .attr("class", "y axis")
            .transition().duration(1500)
            .call(yAxis);

        // Add X and Y labels
        svg.append('g')
            .attr('transform', 'translate(' + (chart.width / 2) + ', ' + (chart.height + 32) + ')')
            .append('text')
            .style("opacity", 0).transition().duration(2000).style("opacity", 1)
            .attr("class", "x label")
            .attr('text-anchor', 'middle')
            .text("Population (in milions, log scale)");

        svg.append('g')
            .attr('transform', 'translate(' + (-margin.left + 15) + ', ' + (chart.height / 2 + margin.top) + ')')
            .append('text')
            .attr("class", "y label")
            .attr('text-anchor', 'middle')
            .attr("transform", "rotate(-90)")
            .text("GDP per Capita (in USD)")
            .style("opacity", 0).transition().duration(2000).style("opacity", 1);

        // Add circles
        var dots = svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "datapoints")
            .attr("cx", 0)
            .attr("cy", (chart.height))
            .attr("r", 0)
            .style("fill", function(d) { return c(d.Continent); })
            .style("opacity", 0.8);

        // Add radius and opacitytransitions
        dots.transition()
            .delay(750)
            .duration(2000)
            .attr("r", function(d) { return r(computeTotalMedails(d)); })
            .attr("cx", function(d) { return x(getPopulation(d)); })
            .attr("cy", function(d) { return y(getGDPperCapita(d)); });

        // Add mouse events
        dots.on("mouseover", mouseOver)
            .on("mousemove", mouseOn)
            .on("mouseleave", mouseLeave);

        // Add country codes
        svg.append('g')
            .selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "datapoints")
            .attr("x", function(d) { return x(getPopulation(d)); })
            .attr("y", function(d) { return y(getGDPperCapita(d)); })
            .attr("dx", function(d) { return 0.75 * r(computeTotalMedails(d)); })
            .attr("dy", function(d) { return -0.8 * r(computeTotalMedails(d)); })
            .text(function(d) { return d.Country_Code; })
            .style("font-size", "8px")
            .style("opacity", 0).transition().delay(500).duration(2000).style("opacity", 0.6);

        // Add color legend
        var colorLegend = svg.selectAll("colorlegend")
            .data(continents)
            .enter().append("g")
            .attr("class", "colorlegend")
            .attr("transform", function(d, i) {
                return "translate(0," + (10 + i * 20) + ")";
            });

        colorLegend.append("circle")
            .attr("cx", chart.width - 8)
            .attr("r", 7)
            .style("fill", function(d) { return c(d); })
            .style("stroke-width", 0)
            .on("mouseover", filterContinents)
            .on("mouseout", filterContinentsOff)
            .style("opacity", 0).transition().delay(1500).duration(2000).style("opacity", 0.8);

        colorLegend.append("text")
            .attr("x", chart.width - 20)
            .attr("y", 0)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .on("mouseover", filterContinents)
            .on("mouseout", filterContinentsOff)
            .text(function(d) { return d; })
            .style("fill-opacity", 0).transition().delay(2000).duration(2000).style("fill-opacity", 0.7);

        // Add radius legend
        var xCircle = chart.width - 270;
        var yCircle = 2 * maxradius + 1;
        var xLabel = xCircle + 100;

        var valuesToShow = [1, Math.round(medals_max / 3), medals_max];

        var radiLegend = svg.selectAll("radilegend")
            .data(valuesToShow)
            .enter()
            .append("g")
            .attr("class", "legend");

        radiLegend.append("circle")
            .attr("cx", xCircle)
            .attr("cy", function(d) { return yCircle - r(d) })
            .attr("r", function(d) { return r(d) })
            .style("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 0.7)
            .style('stroke-opacity', 0).transition().delay(2500).duration(2000).style('stroke-opacity', 0.7);

        radiLegend.append("line")
            .attr('x1', function(d) { return xCircle + r(d); })
            .attr('x2', xLabel)
            .attr('y1', function(d) { return yCircle - r(d); })
            .attr('y2', function(d) { return yCircle - r(d); })
            .attr('stroke', 'black')
            .style('stroke-opacity', 0).transition().delay(2250).duration(2000).style('stroke-opacity', 0.7)
            .attr("stroke-width", 0.5)
            .style('stroke-dasharray', ('2,1'))

        radiLegend.append("text")
            .attr('x', xLabel)
            .attr('dx', '0.5em')
            .attr('y', function(d) { return yCircle - r(d); })
            .text(function(d) { return d; })
            .style("font-size", 10)
            .attr('alignment-baseline', 'middle')
            .style("fill-opacity", 0).transition().delay(2000).duration(2000).style("fill-opacity", 0.6);

        svg.append("text")
            .attr('x', xCircle)
            .attr("y", yCircle + 13)
            .attr("class", "legendtext")
            .text("Medals count")
            .style("fill-opacity", 0).transition().delay(2500).duration(2000).style("fill-opacity", 0.6);

        // Add annotations (Hints)
        var xAnnotation = chart.width / 2;
        var yAnnotation = -3;
        svg.append("text")
            .attr("x", xAnnotation)
            .attr("y", yAnnotation)
            .attr("class", "annotation")
            .style("text-anchor", "middle")
            .text("Tip 1: hover over the bubles for more details; Tip 2: hover over the color legend to filter continents")
            .style('opacity', 0);

        // Add annotations (Max medals)
        var xMaxcountry = chart.width / 2;
        var yMaxcountry = 30;

        var maxCountry = svg.selectAll("maxcountry")
            .data(data.filter(
                function(d) {
                    return (computeTotalMedails(d) == medals_max);
                }
            ))
            .enter()
            .append("g")

        maxCountry.append("line")
            .attr('x1', function(d) { return x(getPopulation(d)); })
            .attr('x2', xMaxcountry)
            .attr('y1', function(d) { return y(getGDPperCapita(d)); })
            .attr('y2', function(d) { return yMaxcountry; })
            .attr('stroke', 'black')
            .style('stroke-opacity', 0).transition().delay(2750).duration(2000).style('stroke-opacity', 0.5)
            .attr("stroke-width", 0.5)
            .style('stroke-dasharray', ('1,1'))

        maxCountry.append("text")
            .attr('x', xMaxcountry)
            .attr('dy', '-0.3em')
            .attr('y', function(d) { return yMaxcountry; })
            .text('Country with most medals')
            .style("font-size", '9pt')
            .style('text-decoration', "underline")
            .style('text-anchor', "middle")
            .style("fill-opacity", 0).transition().delay(3000).duration(2000).style("fill-opacity", 0.5);

        // Add annotations (Hosting country)
        var xHostingcountry = chart.width / 3;
        var yHostingcountry = 50;

        var hostingCountryAnnotation = svg.selectAll("hostingcountry")
            .data(data.filter(
                function(d) {
                    return (d.Country == hostCountry);
                }
            ))
            .enter()
            .append("g")

        hostingCountryAnnotation.append("line")
            .attr('x1', function(d) { return x(getPopulation(d)); })
            .attr('x2', xHostingcountry)
            .attr('y1', function(d) { return y(getGDPperCapita(d)); })
            .attr('y2', function(d) { return yHostingcountry; })
            .attr('stroke', 'black')
            .style('stroke-opacity', 0).transition().delay(3000).duration(2000).style('stroke-opacity', 0.5)
            .attr("stroke-width", 0.5)
            .style('stroke-dasharray', ('1,1'))

        hostingCountryAnnotation.append("text")
            .attr('x', xHostingcountry)
            .attr('dy', '-0.3em')
            .attr('y', function(d) { return yHostingcountry; })
            .text('Hosting country')
            .style("font-size", '9pt')
            .style('text-decoration', "underline")
            .style('text-anchor', "middle")
            .style("fill-opacity", 0).transition().delay(3250).duration(2000).style("fill-opacity", 0.6);

    })

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

    function getMedails(d) {
        const offset = 5 // column number from where the medal columns start
        var index = offset + 3 * (olympicId - 1);

        var bronze = d3.values(d)[index];
        var gold = d3.values(d)[index + 1];
        var silver = d3.values(d)[index + 2];

        bronze = (isNaN(bronze) || bronze == "") ? 0 : parseInt(bronze);
        gold = (isNaN(gold) || gold == "") ? 0 : parseInt(gold);
        silver = (isNaN(silver) || silver == "") ? 0 : parseInt(silver);

        return { gold, silver, bronze };
    }

    function computeTotalMedails(d) {

        let { gold, silver, bronze } = getMedails(d);
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
            medals = computeTotalMedails(data[i]);
            if (maxMedals < medals) {
                maxMedals = medals;
            }
        }
        return maxMedals;
    }

    function getMinMaxPopulation(data) {
        var minPop = Infinity;
        var maxPop = 0;
        let pop;

        for (let i = 0; i < data.length; i++) {
            if (computeTotalMedails(data[i]) > 0 && getGDPperCapita(data[i]) > 0) {
                pop = getPopulation(data[i]);
                if (maxPop < pop) {
                    maxPop = pop;
                }
                if (minPop > pop && pop !== 0) {
                    minPop = pop;
                }
            }
        }
        return [minPop, maxPop];
    }

    function getMinMaxGDP(data) {
        var minGDP = Infinity;
        var maxGDP = 0;
        let gdp;

        for (let i = 0; i < data.length; i++) {
            if (computeTotalMedails(data[i]) > 0 && getPopulation(data[i])) {
                gdp = getGDPperCapita(data[i]);
                if (maxGDP < gdp) {
                    maxGDP = gdp;
                }
                if (minGDP > gdp && gdp !== 0) {
                    minGDP = gdp;
                }
            }
        }
        return [minGDP, maxGDP];
    }

    function getContinentsList(data) {
        const continents = [];

        for (let i = 0; i < data.length; i++) {
            if (computeTotalMedails(data[i]) > 0) {
                if (!continents.includes(data[i].Continent)) {
                    continents.push(data[i].Continent);
                }
            }
        }
        return continents;
    }

    function getTooltipInfo(d) {
        let { gold, silver, bronze } = getMedails(d);
        let totalMedals = computeTotalMedails(d);
        let htmlInfo;

        htmlInfo = "<b>Country:</b> " + d.Country + '<br>' +
            "&emsp;&#8226;<b>&emsp;Population:</b> " + d3.format(',.3s')(getPopulation(d) * 1e6).replace(/G/, "B") + '<br>' +
            "&emsp;&#8226;<b>&emsp;GDP per Capita:</b> " + "$" + d3.format(',.3s')(getGDPperCapita(d)) + '<br><br>' +
            "<b>Total medals won in these Olympics:</b> " + totalMedals + '<br>' +
            "&emsp;&#8226;<b>&emsp;Gold medals:</b> " + gold + '<br>' +
            "&emsp;&#8226;<b>&emsp;Silver medals:</b> " + silver + '<br>' +
            "&emsp;&#8226;<b>&emsp;Bronz medals:</b> " + bronze;

        if (d.Country == 'Germany') {
            htmlInfo += '<br><br> * When applicable, West and East Germany<br> have been counted as a single country.'
        }
        return htmlInfo;
    }

    function filterContinents(d) {
        svg.selectAll('.datapoints')
            .filter(function(data) {
                return (data.Continent != d)
            })
            .transition()
            .style('opacity', 0.04)
    }

    function filterContinentsOff(d) {
        svg.selectAll('.datapoints')
            .transition()
            .style('opacity', 0.8)
    }
}