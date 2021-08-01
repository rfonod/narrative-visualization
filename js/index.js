// Initialize global variables
var sceneId = 0;
var numberOfGames = Infinity; // number of summer/winter olympic games
var hostCountry = '';
var hostCity = '';
var hostYear = '';
var olympics = 0; // {0 - summer; 1 - winter}
var dataPath = '';
var venuePath = '';

function homeScene() {
    sceneId = 0;
    document.getElementById("bp").style.visibility = 'hidden';
    document.getElementById("bn").style.visibility = 'hidden';
    document.getElementById("bh").style.visibility = 'hidden';
    document.getElementById("bs").style.visibility = 'visible';
    document.getElementById("bw").style.visibility = 'visible';
    document.getElementById("bs").innerHTML = "Explore Summer Olympics";
    document.getElementById("bw").innerHTML = "Explore Winter Olympics";
    document.getElementById("bh").innerHTML = "";
    clearVenueYearsChart();
    document.getElementById("introDivId").style.display = "block";
    d3.select("#sourceDivId").html("");
}

function summerOlympics() {
    olympics = 0;
    dataPath = 'data/summer4viz.csv';
    venuePath = 'data/summer4viz_venues.csv';
    initVisualization();
}

function winterOlympics() {
    olympics = 1;
    dataPath = 'data/winter4viz.csv';
    venuePath = 'data/winter4viz_venues.csv';
    initVisualization();
}

function initVisualization() {
    document.getElementById("bn").disabled = false;
    document.getElementById("bp").style.visibility = 'visible';
    document.getElementById("bn").style.visibility = 'visible';
    document.getElementById("bh").style.visibility = 'visible';
    document.getElementById("bw").style.visibility = 'hidden';
    document.getElementById("bs").style.visibility = 'hidden';
    document.getElementById("bh").innerHTML = "Home";
    document.getElementById("bs").innerHTML = "";
    document.getElementById("bw").innerHTML = "";
    document.getElementById("introDivId").style.display = "none";
    nextScene();
    d3.select("#sourceDivId").html("<p>*Original data source: <a href='https://www.kaggle.com/the-guardian/olympic-games'>https://www.kaggle.com/the-guardian/olympic-games</a></p>");
}

function previousScene() {
    if (sceneId > 1) {
        sceneId -= 1;
        document.getElementById("bp").disabled = true;
        document.getElementById("bn").disabled = false;
        updateVenue(sceneId);
        clearVenueYearsChart();
        loadChart1(sceneId);
        loadChart2(sceneId);
    }
    if (sceneId == 1) {
        document.getElementById("bp").disabled = true;
    } else {
        setTimeout(function() {
            document.getElementById("bp").disabled = false;
        }, 200);
    }
}

function nextScene() {
    if (sceneId < numberOfGames) {
        sceneId += 1;
        document.getElementById("bp").disabled = false;
        document.getElementById("bn").disabled = true;
        clearVenueYearsChart();
        updateVenue(sceneId);
        loadChart1(sceneId);
        loadChart2(sceneId);

    }
    if (sceneId == 1) {
        document.getElementById("bp").disabled = true;
    }
    if (sceneId >= numberOfGames) {
        document.getElementById("bn").disabled = true;
    } else {
        setTimeout(function() {
            document.getElementById("bn").disabled = false;
        }, 200);
    }
}

function clearVenueYearsChart() {
    d3.select("#venueDivId").selectAll('h2').remove();
    d3.select("#yearsDivId").selectAll('p').remove();
    document.getElementById("scatterDivId").innerHTML = "";
    document.getElementById("barDivId").innerHTML = "";
}

function updateVenue(olympicId) {

    d3.csv(venuePath, function(error, data) {
        if (error) throw error;

        var olympicsType = '';
        if (olympics) {
            olympicsType = 'Winter';
        } else {
            olympicsType = 'Summer';
        }

        window.numberOfGames = data.length;
        var yearText_i = '';
        var yearText = '';
        yearText = '<p><b>' + olympicsType + ' Olympic games*:</b> ';

        for (var i = 0; i < data.length; i++) {
            if (data[i].ID < olympicId) {
                yearText_i = '<b style="background-color : ' + (olympics ? '#B3DAF1;">' : '#FFFE6F;">') + data[i].Year + '</b>';
            } else if (data[i].ID == olympicId) {
                d3.select("#venueDivId").insert("h2").text(olympicsType + ' Olympics in ' + data[i].City + ' (' +
                    data[i].Year + ')').style('background', olympics ? '#B3DAF1' : '#FFFE6F');
                yearText_i = '<b style="border:2px; border-style:solid; border-color:#FF0000; border-radius: 3px; background-color :' + (olympics ? '#B3DAF1;">' : '#FFFE6F;">') + data[i].Year + '</b>';
                window.hostCountry = data[i].Country;
                window.hostCity = data[i].City;
                window.hostYear = data[i].Year;
            } else {
                yearText_i = data[i].Year;
            }
            if (data[i].ID < olympicId) {
                yearText_i += '<b style="background-color : ' + (olympics ? '#B3DAF1;">' : '#FFFE6F;">') + ((i < data.length - 1) ? ' | ' : '') + '</b>';
            } else {
                yearText_i += (i < data.length - 1) ? ' | ' : '';
            }
            yearText += yearText_i;
        }
        yearText += '</p>';
        d3.select("#yearsDivId").html(yearText);
    });
}