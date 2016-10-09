cdo_key = "gRlDVEGGYUFsfHtuDszEwZUXUDLQblrr";
//Docs http://www.ncdc.noaa.gov/cdo-web/webservices/v2
api_uri_list = 
{
    cdo_dayly:"http://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&locationid=ZIP:{zip}&startdate={start_date}&enddate={end_date}"
};


(function($) {
    "use strict"; // Start of use strict

    // jQuery for page scrolling feature - requires jQuery Easing plugin
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: ($($anchor.attr('href')).offset().top - 50)
        }, 1250, 'easeInOutExpo');
        event.preventDefault();
    });

    // Highlight the top nav as scrolling occurs
    $('body').scrollspy({
        target: '.navbar-fixed-top',
        offset: 100
    });

    // Closes the Responsive Menu on Menu Item Click
    $('.navbar-collapse ul li a').click(function() {
        $('.navbar-toggle:visible').click();
    });

    // Offset for Main Navigation
    $('#mainNav').affix({
        offset: {
            top: 50
        }
    })

    init();

})(jQuery); // End of use strict




function init()
{

   //Get dayly weather data (temp, precip [rain, snow], wind?)

   // make_cdo_request(api_uri_list.cdo_dayly,'2016-09-01','2016-10-01','46140',function(data){

   //      console.log(data);
   // });

   //Make prediction of disease spread based on weather

   //Visualize prediction on map
    
}


function make_cdo_request(requestURL,start_date,end_date,zip,reFunc)
{
    console.log(formatStr(requestURL,[["start_date",start_date],["end_date",end_date],["zip",zip]]));

    $.ajax({
        url: formatStr(requestURL,[["start_date",start_date],["end_date",end_date],["zip",zip]]),
        headers: { 'token': cdo_key},
        success: reFunc
    });

}

function formatStr(str,replacements)
{
    newstr = str;
    for (replacement in replacements)
    {
        newstr = newstr.replace("{" + replacements[replacement][0] + "}",replacements[replacement][1]);
    }

    return newstr;
}




/*
SRC http://stackoverflow.com/questions/12782034/how-do-i-do-a-simple-zip-code-map-showing-boundaries-with-google-maps-api-v3
http://www.geocodezip.com/geoxml3_test/v3_FusionTables_zipcode_map.html
*/
google.load('visualization', '1', {'packages':['corechart', 'table', 'geomap']});
var map;
var labels = [];
var layer;
var tableid =  1499916;

function initMap() {
    geocoder = new google.maps.Geocoder();

    var lat = '';
    var lng = '';
    var address = '46140';
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
         lat = results[0].geometry.location.lat();
         lng = results[0].geometry.location.lng();
        
      } else {
        alert("Geocode was not successful for the following reason: " + status);
      }
    });

    map = new google.maps.Map(document.getElementById('map_canvas'), {
    center: new google.maps.LatLng(lat, lng),
    zoom: 6,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });
  
  layer = new google.maps.FusionTablesLayer(tableid);
  layer.setQuery("SELECT 'geometry' FROM " + tableid);
  layer.setMap(map);

  codeAddress("46140" /*document.getElementById("address").value*/ );

  google.maps.event.addListener(map, "bounds_changed", function() {
    displayZips();
  });
  google.maps.event.addListener(map, "zoom_changed", function() {
    if (map.getZoom() < 11) {
      for (var i=0; i<labels.length; i++) {
        labels[i].setMap(null);
      }
    }
  });
}

function codeAddress(address) {
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
        var marker = new google.maps.Marker({
            map: map, 
            position: results[0].geometry.location
        });
        if (results[0].geometry.viewport) 
          map.fitBounds(results[0].geometry.viewport);
      } else {
        alert("Geocode was not successful for the following reason: " + status);
      }
    });
  }
        
function displayZips() {
  //set the query using the current bounds
  var queryStr = "SELECT geometry, ZIP, latitude, longitude FROM "+ tableid + " WHERE ST_INTERSECTS(geometry, RECTANGLE(LATLNG"+map.getBounds().getSouthWest()+",LATLNG"+map.getBounds().getNorthEast()+"))";   
  var queryText = encodeURIComponent(queryStr);
  var query = new google.visualization.Query('http://www.google.com/fusiontables/gvizdata?tq='  + queryText);
  // alert(queryStr);

  //set the callback function
  query.send(displayZipText);

}
 

  var infowindow = new google.maps.InfoWindow();
        
function displayZipText(response, cdoData) {
if (!response) {
  alert('no response');
  return;
}
if (response.isError()) {
  alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
  return;
} 
  if (map.getZoom() < 11) return;
  FTresponse = response;
  //for more information on the response object, see the documentation
  //http://code.google.com/apis/visualization/documentation/reference.html#QueryResponse
  numRows = response.getDataTable().getNumberOfRows();
  numCols = response.getDataTable().getNumberOfColumns();
/*  var queryStr = "SELECT geometry, ZIP, latitude, longitude FROM "+ tableid + " WHERE ST_INTERSECTS(geometry, RECTANGLE(LATLNG"+map.getBounds().getSouthWest()+",LATLNG"+map.getBounds().getNorthEast()+"))";   
*/



  for(i = 0; i < numRows; i++) {
      var zip = response.getDataTable().getValue(i, 1);
      var zipStr = zip.toString()
      while (zipStr.length < 5) { zipStr = '0' + zipStr; }
      var point = new google.maps.LatLng(
          parseFloat(response.getDataTable().getValue(i, 2)),
          parseFloat(response.getDataTable().getValue(i, 3)));



        if (!cdoData)
        {
            console.log("test " + cdoData+ " " + zipStr)
            make_cdo_request(api_uri_list.cdo_dayly,'2016-09-01','2016-10-01',zipStr,function(data){

                displayZipText(response,data);
           });
            return;

        }

        console.log(cdoData);

        sumMoist = 0;
        for(i in cdoData)
        {
            sumMoist += cdoData[i].value;

        }














      // bounds.extend(point);
      labels.push(new InfoBox({
     content: zipStr + " sev " + (sumMoist/cdoData.length).toString()
    ,boxStyle: {
       border: "1px solid black"
      ,textAlign: "center"
          ,backgroundColor:"white"
      ,fontSize: "8pt"
      ,width: "50px"
     }
    ,disableAutoPan: true
    ,pixelOffset: new google.maps.Size(-25, 0)
    ,position: point
    ,closeBoxURL: ""
    ,isHidden: false
    ,enableEventPropagation: true
      }));
      labels[labels.length-1].open(map);
  }
  // zoom to the bounds
  // map.fitBounds(bounds);
}

google.maps.event.addDomListener(window,'load',initMap);














