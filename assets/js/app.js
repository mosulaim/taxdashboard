var config = {
  geojson: "http://tax.geostation.net/assets/bldall.json",
  title: "Tax Monitor",
  layerName: "Buildings",
  hoverProperty: "PPTY_USE",
  sortProperty: "OBJECTID_1",
  sortOrder: "desc"
};

var buscon = {
business: "http://geostation.herokuapp.com/taxform/pdata.php?geotable=business&"
};

var bldcon = {
  bldabj: "http://tax.geostation.net/assets/bldabj.json"
  };

var properties = [{
  value: "PPTY_ID",
  label: "Property ID",
  table: {
    visible: false,
    sortable: true
  },
  filter: {
    type: "string"
  },
  info: false
},
{
  value: "PPTY_USE",
  label: "Property Use",  //Status
  table: {
    visible: true,
    sortable: true
  },
  filter: {
    type: "string",
    input: "checkbox",
    vertical: true,
    multiple: true,
    operators: ["in", "not_in", "equal", "not_equal"],
    values: []
  }
},
{
  value: "PPTY_TYPE",
  label: "Property Type",  //Inventory Zone
  table: {
    visible: true,
    sortable: true
  },
  filter: {
    type: "string",
    input: "checkbox",
    vertical: true,
    multiple: true,
    operators: ["in", "not_in", "equal", "not_equal"],
    values: []
  }
},
{
  value: "OBJECTID_1",
  label: "Serial Number",  //Inventory
  table: {
    visible: true,
    sortable: true
  },
  filter: {
    type: "integer"
  }
},
{
  value: "TAX_APPLI",
  label: "Tax Applicable",  //Species
  table: {
    visible: true,
    sortable: true
  },
  filter: {
    type: "string"
  }
},
{
  value: "photos_url",
  label: "Photos",
  table: {
    visible: false,
    sortable: true,
    formatter: urlFormatter
  },
  filter: false
},
{
  value: "LT_AMT_PD",
  label: "Last Tax Paid",
  table: {
    visible: true,
    sortable: true
  },
  filter: {
    type: "integer"
  }
}
/*,
{
  value: "dbh_2012_inches_diameter_at_breast_height_46",
  label: "DBH (inches)",
  table: {
    visible: true,
    sortable: true
  },
  filter: {
    type: "integer"
  }
},
{
  value: "plaque",
  label: "Plaque",
  table: {
    visible: true,
    sortable: true
  },
  filter: {
    type: "string",
    input: "radio",
    operators: ["equal"],
    values: {
      "yes": "Yes",
      "no": "No"
    }
  }
}  // my comment
*/
];


function viewbusi(bid) {
 // alert('Business being fetched: ' + bid);
  $('#featureModal').modal('hide');
  $("#loading-mask").show();
  $.getJSON(buscon.business + 'parameters=bld_id=' + bid, function (data) {
    //geojson = data;
  /*  features = $.map(data.features, function(feature) {
      return feature.properties;
    });   */
    $("#loading-mask").hide();
    businessLayer.clearLayers();
    businessLayer.addData(data);
    map.fitBounds(businessLayer.getBounds());
    BusinessDetail(data);

  });

/*
  $.ajax({  
    url: config.business + 'parameters=bld_id=' + bid,  
    method:"GET", 
    dataType:"json",  
    success:function(data){ 
     // businessLayer.addData(data);
      var businessLayer = L.geoJSON(data, {}).addTo(map);
      map.fitBounds(businessLayer.getBounds());
    }  
 });   */
}
function liveData() {
  $.getJSON(buscon.business, function (data) {
    liveLayer.clearLayers();
    liveLayer.addData(data);
    map.fitBounds(liveLayer.getBounds()); 
  });   
  if (document.getElementById("autosec").checked) {
       setTimeout(function() {liveData()}, 5000);
  }
}

function drawSepChart() {
  // Property Use 2
  $(function() {
    var result = alasql("SELECT PPTY_USE AS label, COUNT(*) AS total FROM ? GROUP BY PPTY_USE", [features]);
    var columns = $.map(result, function(propuse) {
      return [[propuse.label, propuse.total]];
    });
    var chart = c3.generate({
        bindto: "#propUse2-chart",
        size: {
          height: 250
        },
        data: {
          type: "pie",
          columns: columns
        }
    });
  });
  $(function() {
    var result = alasql("SELECT TAX_APPLI AS label, SUM(LT_AMT_PD::NUMBER) AS Revenue FROM ? GROUP BY TAX_APPLI", [features]);
    var chart = c3.generate({
        bindto: "#revenue-chart",
        size: {
          height: 250
        },
        data: {
          json: result,
          keys: {
            x: "label",
            value: ["Revenue"]
          },
          type: "bar"
        },
        axis: {
          rotated: false,
          x: {
            type: "category"
          }
        },
        legend: {
          show: true
        }
    });
  });
} 

function drawCharts() {
  // Property Use
  $(function() {
    var result = alasql("SELECT PPTY_USE AS label, COUNT(*) AS total FROM ? GROUP BY PPTY_USE", [features]);
    var columns = $.map(result, function(propuse) {
      return [[propuse.label, propuse.total]];
    });
    var chart = c3.generate({
        bindto: "#propUse-chart",
        data: {
          type: "pie",
          columns: columns
        }
    });
  });

   // Property Type
   $(function() {
    var result = alasql("SELECT PPTY_TYPE AS label, COUNT(*) AS total FROM ? GROUP BY PPTY_TYPE", [features]);
    var columns = $.map(result, function(proptype) {
      return [[proptype.label, proptype.total]];
    });
    var chart = c3.generate({
        bindto: "#type-chart",
        data: {
          type: "pie",
          columns: columns
        }
    });
  });

  // Tax type
  $(function() {
    var result = alasql("SELECT TAX_APPLI AS label, COUNT(*) AS total FROM ? GROUP BY TAX_APPLI", [features]);
    var columns = $.map(result, function(taxtype) {
      return [[taxtype.label, taxtype.total]];
    });
    var chart = c3.generate({
        bindto: "#taxtype-chart",
        data: {
          type: "pie",
          columns: columns
        }
    });
  });

    // Tax paid
  $(function() {
    var result = alasql("SELECT PPTY_USE AS label, SUM(LT_AMT_PD::NUMBER) AS revenue FROM ? GROUP BY PPTY_USE", [features]);
    var chart = c3.generate({
        bindto: "#taxpaid-chart",
        size: {
          height: 300
        },
        data: {
          json: result,
          keys: {
            x: "label",
            value: ["revenue"]
          },
          type: "bar"
        },
        axis: {
          rotated: false,
          x: {
            type: "category"
          }
        },
        legend: {
          show: true
        }
    });
  });
/*

  // Size
  $(function() {
    var sizes = [];
    var regeneration = alasql("SELECT 'Regeneration (< 3\")' AS category, COUNT(*) AS total FROM ? WHERE CAST(dbh_2012_inches_diameter_at_breast_height_46 as INT) < 3", [features]);
    var sapling = alasql("SELECT 'Sapling/poles (1-9\")' AS category, COUNT(*) AS total FROM ? WHERE CAST(dbh_2012_inches_diameter_at_breast_height_46 as INT) BETWEEN 1 AND 9", [features]);
    var small = alasql("SELECT 'Small trees (10-14\")' AS category, COUNT(*) AS total FROM ? WHERE CAST(dbh_2012_inches_diameter_at_breast_height_46 as INT) BETWEEN 10 AND 14", [features]);
    var medium = alasql("SELECT 'Medium trees (15-19\")' AS category, COUNT(*) AS total FROM ? WHERE CAST(dbh_2012_inches_diameter_at_breast_height_46 as INT) BETWEEN 15 AND 19", [features]);
    var large = alasql("SELECT 'Large trees (20-29\")' AS category, COUNT(*) AS total FROM ? WHERE CAST(dbh_2012_inches_diameter_at_breast_height_46 as INT) BETWEEN 20 AND 29", [features]);
    var giant = alasql("SELECT 'Giant trees (> 29\")' AS category, COUNT(*) AS total FROM ? WHERE CAST(dbh_2012_inches_diameter_at_breast_height_46 as INT) > 29", [features]);
    sizes.push(regeneration, sapling, small, medium, large, giant);
    var columns = $.map(sizes, function(size) {
      return [[size[0].category, size[0].total]];
    });
    var chart = c3.generate({
        bindto: "#size-chart",
        data: {
          type: "pie",
          columns: columns
        }
    });
  });

  // Species
  $(function() {
    var result = alasql("SELECT species_sim AS label, COUNT(*) AS total FROM ? GROUP BY species_sim ORDER BY label ASC", [features]);
    var chart = c3.generate({
        bindto: "#species-chart",
        size: {
          height: 2000
        },
        data: {
          json: result,
          keys: {
            x: "label",
            value: ["total"]
          },
          type: "bar"
        },
        axis: {
          rotated: true,
          x: {
            type: "category"
          }
        },
        legend: {
          show: false
        }
    });
  });
  */
}


$(function() {
  $(".title").html(config.title);
  $("#layer-name").html(config.layerName);
});

function buildConfig() {
  filters = [];
  table = [{
    field: "action",
    title: "<i class='fa fa-gear'></i>&nbsp;Action",
    align: "center",
    valign: "middle",
    width: "75px",
    cardVisible: false,
    switchable: false,
    formatter: function(value, row, index) {
      return [
        '<a class="zoom" href="javascript:void(0)" title="Zoom" style="margin-right: 10px;">',
          '<i class="fa fa-search-plus"></i>',
        '</a>',
        '<a class="identify" href="javascript:void(0)" title="Identify">',
          '<i class="fa fa-info-circle"></i>',
        '</a>'
      ].join("");
    },
    events: {
      "click .zoom": function (e, value, row, index) {
        map.fitBounds(featureLayer.getLayer(row.leaflet_stamp).getBounds());
        highlightLayer.clearLayers();
        highlightLayer.addData(featureLayer.getLayer(row.leaflet_stamp).toGeoJSON());
      },
      "click .identify": function (e, value, row, index) {
        identifyFeature(row.leaflet_stamp);
        highlightLayer.clearLayers();
        highlightLayer.addData(featureLayer.getLayer(row.leaflet_stamp).toGeoJSON());
      }
    }
  }];



  $.each(properties, function(index, value) {
    // Filter config
    if (value.filter) {
      var id;
      if (value.filter.type == "integer") {
        id = "cast(properties->"+ value.value +" as int)";
      }
      else if (value.filter.type == "double") {
        id = "cast(properties->"+ value.value +" as double)";
      }
      else {
        id = "properties->" + value.value;
      }
      filters.push({
        id: id,
        label: value.label
      });
      $.each(value.filter, function(key, val) {
        if (filters[index]) {
          // If values array is empty, fetch all distinct values
          if (key == "values" && val.length === 0) {
            alasql("SELECT DISTINCT(properties->"+value.value+") AS field FROM ? ORDER BY field ASC", [geojson.features], function(results){
              distinctValues = [];
              $.each(results, function(index, value) {
                distinctValues.push(value.field);
              });
            });
            filters[index].values = distinctValues;
          } else {
            filters[index][key] = val;
          }
        }
      });
    }
    // Table config
    if (value.table) {
      table.push({
        field: value.value,
        title: value.label
      });
      $.each(value.table, function(key, val) {
        if (table[index+1]) {
          table[index+1][key] = val;
        }
      });
    }
  });

  buildFilters();
  buildTable();
}

// Basemap Layers
/*var mapboxOSM = L.tileLayer("https://{s}.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibW9zdWxhaW0iLCJhIjoiY2pnNWI0dnU5MGNpYjJxcm5hcmFhd2V3bSJ9.wFuvx6_m8xxdHtavOTMFXA", {
  maxZoom: 19,
  subdomains: ["a", "b", "c", "d"],
  attribution: 'Powered by <a href="http://www.geostation.net/" target="_blank">GeoStation</a> by Sulaiman'
});*/
var mapboxOSM = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibW9zdWxhaW0iLCJhIjoiY2pnNWI0dnU5MGNpYjJxcm5hcmFhd2V3bSJ9.wFuvx6_m8xxdHtavOTMFXA', {
  maxZoom: 19,
  tileSize: 512,
  zoomOffset: -1,
  attribution: 'Powered by <a href="http://www.geostation.net/" target="_blank">GeoStation</a> by Sulaiman'
});
var mapboxSat = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibW9zdWxhaW0iLCJhIjoiY2pnNWI0dnU5MGNpYjJxcm5hcmFhd2V3bSJ9.wFuvx6_m8xxdHtavOTMFXA', {
  maxZoom: 19,
  attribution: 'Powered by <a href="http://www.geostation.net/" target="_blank">GeoStation</a> by Sulaiman'
});
/*var mapboxSat = L.tileLayer("https://{s}.tiles.mapbox.com/v4/mapbox.streets-satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibW9zdWxhaW0iLCJhIjoiY2pnNWI0dnU5MGNpYjJxcm5hcmFhd2V3bSJ9.wFuvx6_m8xxdHtavOTMFXA", {
  maxZoom: 19,
  subdomains: ["a", "b", "c", "d"],
  attribution: 'Powered by <a href="http://www.geostation.net/" target="_blank">GeoStation</a> by Sulaiman'
});*/

var highlightLayer = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 5,
      color: "#FFF",
      weight: 2,
      opacity: 1,
      fillColor: "#00FFFF",
      fillOpacity: 1,
      clickable: false
    });
  },
  style: function (feature) {
    return {
      color: "#00FFFF",
      weight: 2,
      opacity: 1,
      fillColor: "#00FFFF",
      fillOpacity: 0.5,
      clickable: false
    };
  }
});

var businessLayer = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 5,
      color: "#FFF",
      weight: 2,
      opacity: 1,
      fillColor: "#0066FF",
      fillOpacity: 1,
      clickable: false
    });
  }
});

var liveLayer = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    if (feature.properties.tax_status != 'Paid') {
      markerColor = "#FF0040";
    } else {
      markerColor = "#00FF66";
    }
    return L.circleMarker(latlng, {
      radius: 5,
      color: "#FFF",
      weight: 2,
      opacity: 1,
      fillColor: markerColor,
      fillOpacity: 1,
      clickable: true
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      layer.on({
        click: function (e) {
          liveIdentify(L.stamp(layer));
        }
      });
    }
  }
});


var featureLayer = L.geoJson(null, {
  filter: function(feature, layer) {
    return feature.geometry.coordinates[0] !== 0 && feature.geometry.coordinates[1] !== 0;
  },
  style: function(feature) {
    if (feature.properties.PPTY_USE == 'COMMERCIAL') {
        return {
            weight: 1,
            opacity: 1,
            color: '#ff6600',
            fillOpacity: 0.3,
            fillColor: '#ff6600'
        };
    } else if (feature.properties.PPTY_USE == 'INSTITUTIONAL'){
        return {
          weight: 1,
          opacity: 1,
          color: '#00ff22',
          fillOpacity: 0.3,
          fillColor: '#00ff22'
        };
    } else {
        return {
            weight: 1,
            opacity: 1,
            color: '#0099FF',
            fillOpacity: 0.3,
            fillColor: '#0099FF'
        };
    }
},
  /*pointToLayer: function (feature, latlng) {
    if (feature.properties && feature.properties["marker-color"]) {
      markerColor = feature.properties["marker-color"];
    } else {
      markerColor = "#FF0000";
    }
    return L.circleMarker(latlng, {
      radius: 4,
      weight: 2,
      fillColor: markerColor,
      color: markerColor,
      opacity: 1,
      fillOpacity: 1
    });
  },*/
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      layer.on({
        click: function (e) {
          identifyFeature(L.stamp(layer));
          highlightLayer.clearLayers();
          highlightLayer.addData(featureLayer.getLayer(L.stamp(layer)).toGeoJSON());
        },
        mouseover: function (e) {
          if (config.hoverProperty) {
            $(".info-control").html(feature.properties[config.hoverProperty]);
            $(".info-control").show();
          }
        },
        mouseout: function (e) {
          $(".info-control").hide();
        }
      });
    }
  }
});

/*var bldabjLayer = featureLayer;
$.getJSON(bldcon.bldabj, function (data) {
  bldabjLayer.addData(data);
}); */

// Fetch the GeoJSON file
$.getJSON(config.geojson, function (data) {
  geojson = data;
  features = $.map(geojson.features, function(feature) {
    return feature.properties;
  });
  featureLayer.addData(data);
  buildConfig();
  $("#loading-mask").hide();
});

var map = L.map("map", {
  layers: [mapboxOSM, featureLayer, highlightLayer, businessLayer, liveLayer]
}).fitWorld();

// ESRI geocoder
var searchControl = L.esri.Geocoding.Controls.geosearch({
  useMapBounds: 17
}).addTo(map);

// Info control
var info = L.control({
  position: "bottomleft"
});

// Custom info hover control
info.onAdd = function (map) {
  this._div = L.DomUtil.create("div", "info-control");
  this.update();
  return this._div;
};
info.update = function (props) {
  this._div.innerHTML = "";
};
info.addTo(map);
$(".info-control").hide();

// Larger screens get expanded layer control
if (document.body.clientWidth <= 767) {
  isCollapsed = true;
} else {
  isCollapsed = false;
}
var baseLayers = {
  "Aerial Imagery": mapboxSat,
  "Street Map": mapboxOSM
};
var overlayLayers = {
  "<span id='layer-name'>Buildings</span>": featureLayer
};
var layerControl = L.control.layers(baseLayers, overlayLayers, {
  collapsed: isCollapsed
}).addTo(map);

// Filter table to only show features in current map bounds
map.on("moveend", function (e) {
  syncTable();
});

map.on("click", function(e) {
  highlightLayer.clearLayers();
});

// Table formatter to make links clickable
function urlFormatter (value, row, index) {
  if (typeof value == "string" && (value.indexOf("http") === 0 || value.indexOf("https") === 0)) {
    return "<a href='"+value+"' target='_blank'>"+value+"</a>";
  }
}

function buildFilters() {
  $("#query-builder").queryBuilder({
    allow_empty: true,
    filters: filters
  });
}

function applyFilter() {
  var query = "SELECT * FROM ?";
  var sql = $("#query-builder").queryBuilder("getSQL", false, false).sql;
  if (sql.length > 0) {
    query += " WHERE " + sql;
  }
  alasql(query, [geojson.features], function(features){
		featureLayer.clearLayers();
		featureLayer.addData(features);
		syncTable();
	});
}

function buildTable() {
  $("#table").bootstrapTable({
    cache: false,
    height: $("#table-container").height(),
    undefinedText: "",
    striped: false,
    pagination: false,
    minimumCountColumns: 1,
    sortName: config.sortProperty,
    sortOrder: config.sortOrder,
    toolbar: "#toolbar",
    search: true,
    trimOnSearch: false,
    showColumns: true,
    showToggle: true,
    columns: table,
    onClickRow: function (row) {
      // do something!
    },
    onDblClickRow: function (row) {
      // do something!
    }
  });

  map.fitBounds(featureLayer.getBounds());

  $(window).resize(function () {
    $("#table").bootstrapTable("resetView", {
      height: $("#table-container").height()
    });
  });
}

function syncTable() {
  tableFeatures = [];
  featureLayer.eachLayer(function (layer) {
    layer.feature.properties.leaflet_stamp = L.stamp(layer);
    if (map.hasLayer(featureLayer)) {
      if (map.getBounds().contains(layer.getBounds())) {
        tableFeatures.push(layer.feature.properties);
      }
    }
  });
  $("#table").bootstrapTable("load", JSON.parse(JSON.stringify(tableFeatures)));
  var featureCount = $("#table").bootstrapTable("getData").length;
  if (featureCount == 1) {
    $("#feature-count").html($("#table").bootstrapTable("getData").length + " visible feature");
  } else {
    $("#feature-count").html($("#table").bootstrapTable("getData").length + " visible features");
  }
}

function identifyFeature(id) {
  var featureProperties = featureLayer.getLayer(id).feature.properties;
  var content = "<table class='table table-striped table-bordered table-condensed'>";
  $.each(featureProperties, function(key, value) {
    if (!value) {
      value = "";
    }
    if (typeof value == "string" && (value.indexOf("http") === 0 || value.indexOf("https") === 0)) {
      value = "<a href='" + value + "' target='_blank'>" + value + "</a>";
    }
    $.each(properties, function(index, property) {
      if (key == property.value) {
        if (property.info !== false) {
          content += "<tr><th>" + property.label + "</th><td>" + value + "</td></tr>";
        }
      }
    });
  });
  content += "<table>";
 // content += '<input type="hidden" value="' + id + '" name="bid" id="bid">';
  $("#feature-info").html(content);
  document.getElementById("viewbusi").style.visibility = "visible";
  document.getElementById("viewbusi").setAttribute( "onClick", 'javascript:viewbusi('+ featureProperties.OBJECTID_1 +');' );
  $("#featureModal").modal("show");
}

function BusinessDetail(data) {
  var businessFeatures = data.features;
  var content = "<table class='table table-striped table-bordered table-condensed'>";
  var tabhead;
  var tabrow, tabbody = "";
  businessFeatures.forEach(function(entry) {
    var businessProperties = entry.properties;
    tabhead = "";
    tabrow = "";
    $.each(businessProperties, function(key, value) {
      if (!value) {
        value = "";
      }
      if (typeof value == "string" && (value.indexOf("http") === 0 || value.indexOf("https") === 0)) {
        value = "<a href='" + value + "' target='_blank'>" + value + "</a>";
      }
      tabhead += "<th>" + key + "</th>";
      tabrow += "<td>" + value + "</td>";
    });  
    tabbody += "<tr>" + tabrow + "</tr>";
  });
  tabhead = '<thead><tr>' + tabhead + '</tr></thead>';
  content += tabhead + tabbody + "</table>";
  $("#business-info").html(content);
  $("#businessModal").modal("show");
}

function liveIdentify(id) {
  var featureProperties = liveLayer.getLayer(id).feature.properties;
  var content = "<table class='table table-striped table-bordered table-condensed'>";
  $.each(featureProperties, function(key, value) {
    if (!value) {
      value = "";
    }
    if (typeof value == "string" && (value.indexOf("http") === 0 || value.indexOf("https") === 0)) {
      value = "<a href='" + value + "' target='_blank'><img src='" + value + "' alt='" + value + "' height='300'></a>";
    }
    if (typeof value == "string" && key == "pic" && value != "") {
      showPic(value);
      value = '<div id="picresults">Fetching Picture, Please wait...Will load here</div>'
    }
    content += "<tr><th>" + key + "</th><td>" + value + "</td></tr>";
  });
  content += "<table>";
 // content += '<input type="hidden" value="' + id + '" name="bid" id="bid">';
  $("#feature-info").html(content);
  document.getElementById("viewbusi").style.visibility = "hidden";
  $("#featureModal").modal("show");
}

function showPic(mfilename) {
  var ACCESS_TOKEN = 'zXHE73rNcUkAAAAAAAABHTXMaxE9Ggo1xWeOqMD1hnha8929BWeSm1LLdaB-e76B'; // document.getElementById('access-token').value;
  var FILE_NAME = mfilename;
  var imageurl;
  var dbx = new Dropbox.Dropbox({ accessToken: ACCESS_TOKEN });
  dbx.filesDownload({path: '/' + FILE_NAME})
  //dbx.sharingGetSharedLinkFile({url: SHARED_LINK})
    .then(function(data) {
      var downloadUrl = URL.createObjectURL(data.fileBlob);
      imageurl = "<a href='" + downloadUrl + "' target='_blank' download='" + data.name + "'>" + "<img style='height:300px;' src='" + downloadUrl + "' alt='" + data.name + "'></a>";
      document.getElementById('picresults').innerHTML = imageurl;
    })
    .catch(function(error) {
      document.getElementById('picresults').innerHTML = "Picture Unavailable!";
      console.error(error);
    });
  return false;
}

$("#livedata-btn").click(function() {
  layerControl.addOverlay(liveLayer, "Business Points")
  document.getElementById("autosec-btn").style.display = "block";
  document.getElementById("autosec").checked = true;
  liveData();
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

function switchView(view) {
  if (view == "split") {
    $("#view").html("Split View");
    location.hash = "#split";
    $("#table-container").show();
    $("#table-container").css("height", "50%");
    $("#map-container").show();
    $("#map-container").css("height", "50%");
    $("#chart-container").show();
    $(window).resize();
    if (map) {
      map.invalidateSize();
    }
  } else if (view == "map") {
    $("#view").html("Map View");
    location.hash = "#map";
    $("#map-container").show();
    $("#chart-container").show();
    $("#map-container").css("height", "100%");
    $("#table-container").hide();
    if (map) {
      map.invalidateSize();
    }
  } else if (view == "table") {
    $("#view").html("Table View");
    location.hash = "#table";
    $("#table-container").show();
    $("#table-container").css("height", "100%");
    $("#map-container").hide();
    $("#chart-container").hide();
    $(window).resize();
  }
}

$("[name='view']").click(function() {
  $(".in,.open").removeClass("in open");
  if (this.id === "map-graph") {
    switchView("split");
    return false;
  } else if (this.id === "map-only") {
    switchView("map");
    return false;
  } else if (this.id === "graph-only") {
    switchView("table");
    return false;
  }
});

$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#filter-btn").click(function() {
  $("#filterModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#chart-btn").click(function() {
  $("#chartModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#view-sql-btn").click(function() {
  alert($("#query-builder").queryBuilder("getSQL", false, false).sql);
});

$("#apply-filter-btn").click(function() {
  applyFilter();
});

$("#reset-filter-btn").click(function() {
  $("#query-builder").queryBuilder("reset");
  applyFilter();
});

$("#extent-btn").click(function() {
  map.fitBounds(featureLayer.getBounds());
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#download-csv-btn").click(function() {
  $("#table").tableExport({
    type: "csv",
    ignoreColumn: [0],
    fileName: "data"
  });
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#download-excel-btn").click(function() {
  $("#table").tableExport({
    type: "excel",
    ignoreColumn: [0],
    fileName: "data"
  });
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#download-pdf-btn").click(function() {
  $("#table").tableExport({
    type: "pdf",
    ignoreColumn: [0],
    fileName: "data",
    jspdf: {
      format: "bestfit",
      margins: {
        left: 20,
        right: 10,
        top: 20,
        bottom: 20
      },
      autotable: {
        extendWidth: false,
        overflow: "linebreak"
      }
    }
  });
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#chartModal").on("shown.bs.modal", function (e) {
  drawCharts();
});
$(document).one("ajaxStop", function () {
  drawSepChart();
});
