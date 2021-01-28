/*----------------------------------*/
/* OL_1.js							*/
/* UNIGIS MSc Dissertation web tool	*/
/* OpenLayers JavaScript - colours1	*/
/* Date: 03/04/2017					*/
/* Author: Eddie Boyle				*/
/* OS DataHub updates 28/01/21		*/
/*----------------------------------*/

//OpenLayers map
function OL_map() {

    //New OS DataHub/Maps API code
    var apiKey = 'MQO2QVcsCR3qhKi8Xjw1TSUJbCmP5Zq3';
    var serviceUrl = 'https://api.os.uk/maps/raster/v1/zxy';

    // Setup the EPSG:27700 (British National Grid) projection.
    proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs");
    var projection = ol.proj.get('EPSG:27700');
    var extent = ol.proj.transformExtent([-8.74, 49.81, 1.84, 60.9], 'EPSG:4326', 'EPSG:27700');

    var tilegrid = new ol.tilegrid.TileGrid({
        resolutions: [ 896.0, 448.0, 224.0, 112.0, 56.0, 28.0, 14.0, 7.0, 3.5, 1.75, 0.875, 0.4375, 0.21875, 0.109375 ],
        origin: [ -238375.0, 1376256.0 ]
    });

    //add GeoServer WMS layers
    var layer_remoteness = new ol.layer.Image({
    	source: new ol.source.ImageWMS({
			projection: projection,
       		url: 'http://52.209.201.41:8080/geoserver/cite/wms',
       		params: {'LAYERS': 'cite:CNP_remote1'},
       		serverType: 'geoserver',
       		crossOrigin: ''
   		}),
   		opacity: 0.25,
   		title: 'Remoteness',
   		description: 'Remoteness from mechanised access; distance from constructed vehicular access routes (roads)'
	});
	var layer_ruggedness = new ol.layer.Image({
       	source: new ol.source.ImageWMS({
			projection: projection,
	       	url: 'http://52.209.201.41:8080/geoserver/cite/wms',
	       	params: {'LAYERS': 'cite:CNP_ruggedness1'},
	       	serverType: 'geoserver',
	       	crossOrigin: ''
       	}),
       	opacity: 0.25,
       	title: 'Ruggedness',
       	description: 'Rugged terrain; physically challenging terrain including effects of steep and rough terrain and harsh weather conditions often found at higher altitudes'
	});
 	var layer_absence = new ol.layer.Image({
	    source: new ol.source.ImageWMS({
			projection: projection,
	        url: 'http://52.209.201.41:8080/geoserver/cite/wms',
	        //params: {'LAYERS': 'cite:CNP_absence1'},
	       	params: {'LAYERS': 'cite:CNP_absence2'},
	        serverType: 'geoserver',
	    	crossOrigin: ''
	    }),
		opacity: 0.25,
		title: 'Absence',
		description: 'Absence of modern human artefacts; the degree to which the landscape is free from the presence of the permanent structures of modern society, i.e. buildings'
  	});
   	var layer_naturalness = new ol.layer.Image({
   		source: new ol.source.ImageWMS({
			projection: projection,
    		url: 'http://52.209.201.41:8080/geoserver/cite/wms',
       		params: {'LAYERS': 'cite:CNP_naturalness2'},
       		serverType: 'geoserver',
       		crossOrigin: ''
       	}),
   		opacity: 0.25,
   		title: 'Naturalness',
   		description: 'Naturalness of land cover; the degree to which the natural environment is free of biophysical disturbances due to the influence of modern society; based on land cover classifications and weightings'
	});

	//OSM layer, unused currently
	var layer_OSM = new ol.layer.Tile({
		baseLayer: true,
   		source: new ol.source.OSM(),
   		opacity: 1.0,
   		visible: true,
   		title: 'OSM',
   		description: 'OpenStreetMap'
	})

	//main map layer and view
	var view1 = new ol.View({
			projection: projection,
			resolutions: tilegrid.getResolutions(),
    		center: ol.proj.fromLonLat([-3.55, 57.05], projection),
    		zoom: 2,
    		minZoom: 0,
            maxZoom: 13
  });
  //overview map layer and view
	var view2 = new ol.View({
   		projection: projection,
   		center: ol.proj.fromLonLat([-3.55, 57.05], projection),
		 	extent: extent,
			maxResolution: 2500
  });

	// A group layer for OS OpenHub and GeoServer SNH base layers
	var baseLayers = new ol.layer.Group({
		title: 'Base Layers',
		description: 'Base layer maps',
		openInLayerSwitcher: false,
		layers:
		[
			new ol.layer.Image({
				baseLayer: true,
	        	source: new ol.source.ImageWMS({
					projection: projection,
	            	url: 'http://52.209.201.41:8080/geoserver/cite/wms',
	            	params: {'LAYERS': 'cite:WILDLAND_SCOTLAND'},
	            	serverType: 'geoserver',
	            	crossOrigin: ''
	        		}),
	        	opacity: 0.25,
	        	visible: false,
	        	title: 'SNH Wild Land',
      			description: 'SNH Wild Land areas 2014'
			}),
     		new ol.layer.Image({
				baseLayer: true,
     			source: new ol.source.ImageWMS({
					projection: projection,
         			url: 'http://52.209.201.41:8080/geoserver/cite/wms',
         			params: {'LAYERS': 'cite:WILDNESS-CMP_SCOTLAND'},
         			serverType: 'geoserver',
         			crossOrigin: ''
     			}),
     			opacity: 0.25,
	        	visible: false,
     			title: 'SNH Wildness',
     			description: 'SNH Wildness map of Scotland'
			}),
			new ol.layer.Tile({
				baseLayer: true,
                source: new ol.source.XYZ({
                    url: serviceUrl + '/Outdoor_27700/{z}/{x}/{y}.png?key=' + apiKey,
                    projection: projection,
                    tileGrid: tilegrid
                }),
                opacity: 0.7,
                title: 'OS',
      			description: 'OS DataHub Maps API Outdoor'
            })
		]
	});

	var map = new ol.Map({
  		target: 'map',
  		logo: false,
  		view: view1,
     	controls: ol.control.defaults({
        	attributionOptions: ({
        		collapsible: false
        	})
    	}).extend([
			// Add a scale bar, layer switcher, custom extent button,overview map and OS logo to the map
  		new ol.control.ScaleLine(),
			new ol.control.OverviewMap({
                collapsed: false,
                view: view2
      }),
    	new ol.control.ZoomToExtent({
        		label:'NP',
        		className: 'customExtentZoomClass',
        		tipLabel : 'Reset to CNP boundary',
      			extent: [249588.32,762436.42,351547.78,836671.46]
    	}),
			new ol.control.LayerSwitcher({
				tipLabel : 'Map layers',
				oninfo: function (l) { alert(l.get("description")); }
			})
		]),
		layers: [ baseLayers, layer_remoteness, layer_ruggedness, layer_absence, layer_naturalness ]
	});

	//Enable multiplicative alpha blending of layer opacities - note: this does not work in IE browsers
	map.on('precompose', function(evt) {
  		evt.context.globalCompositeOperation = "multiply";
	});

	//Enable export PNG of map - note: this does not work in IE browsers
	var exportPNGElement = document.getElementById('export-png');
	if ('download' in exportPNGElement) {
		exportPNGElement.addEventListener('click', function(e) {
	    	map.once('postcompose', function(event) {
	        	var canvas = event.context.canvas;
	        	exportPNGElement.href = canvas.toDataURL('image/png');
	      	});
	      	map.renderSync();
	    },false);
	}
	else {
		var info = document.getElementById('no-download');
	    //display error message
	    info.style.display = '';
	}
}

//Data slider window
jQuery(document).ready(function($){
    $("#data-slide").click(function() {
        $(this).stop().animate({right: '-500px'});
    });
});

jQuery(document).ready(function($){
    $(".open-data").click(function() {
        $("#data-slide").stop().animate({right: '0px'});
    });
});

//Help slider window
jQuery(document).ready(function($){
    $("#help-slide").click(function() {
        $(this).stop().animate({left: '-500px'});
    });
});

jQuery(document).ready(function($){
    $(".open-help").click(function() {
        $("#help-slide").stop().animate({left: '0px'});
    });
});