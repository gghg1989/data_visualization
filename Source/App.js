Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MDYxMTVjYy05ZmI4LTQwNWMtOTdkZi05YWZlMGIzOTFmNTUiLCJpZCI6NjgwOSwic2NvcGVzIjpbImFzbCIsImFzciIsImFzdyIsImdjIl0sImlhdCI6MTU0NzU4MzkwM30.YnntM1PtfzuUjUiIMjysJDZP2eqfXaMCsBmzxzKVWEQ';
//var viewer = new Cesium.Viewer('cesiumContainer');
/*  var viewer = new Cesium.Viewer('cesiumContainer', {
     terrainProvider: Cesium.createWorldTerrain()
 });
 var tileset = viewer.scene.primitives.add(
     new Cesium.Cesium3DTileset({
         url: Cesium.IonResource.fromAssetId(14161)
     })
 );
 viewer.zoomTo(tileset);*/
/**
 * This class is an example of a custom DataSource.  It loads JSON data as
 * defined by Google's WebGL Globe, https://github.com/dataarts/webgl-globe.
 * @alias WebGLGlobeDataSource
 * @constructor
 *
 * @param {String} [name] The name of this data source.  If undefined, a name
 *                        will be derived from the url.
 *
 * @example
 * var dataSource = new Cesium.WebGLGlobeDataSource();
 * dataSource.loadUrl('sample.json');
 * viewer.dataSources.add(dataSource);
 */
function WebGLGlobeDataSource(name) {
    //All public configuration is defined as ES5 properties
    //These are just the "private" variables and their defaults.
    this._name = name;
    this._changed = new Cesium.Event();
    this._error = new Cesium.Event();
    this._isLoading = false;
    this._loading = new Cesium.Event();
    this._entityCollection = new Cesium.EntityCollection();
    this._seriesNames = [];
    this._seriesToDisplay = undefined;
    this._heightScale = 10000000;
    this._entityCluster = new Cesium.EntityCluster();
}

Object.defineProperties(WebGLGlobeDataSource.prototype, {
    //The below properties must be implemented by all DataSource instances

    /**
     * Gets a human-readable name for this instance.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {String}
     */
    name : {
        get : function() {
            return this._name;
        }
    },
    /**
     * Since WebGL Globe JSON is not time-dynamic, this property is always undefined.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {DataSourceClock}
     */
    clock : {
        value : undefined,
        writable : false
    },
    /**
     * Gets the collection of Entity instances.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {EntityCollection}
     */
    entities : {
        get : function() {
            return this._entityCollection;
        }
    },
    /**
     * Gets a value indicating if the data source is currently loading data.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {Boolean}
     */
    isLoading : {
        get : function() {
            return this._isLoading;
        }
    },
    /**
     * Gets an event that will be raised when the underlying data changes.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {Event}
     */
    changedEvent : {
        get : function() {
            return this._changed;
        }
    },
    /**
     * Gets an event that will be raised if an error is encountered during
     * processing.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {Event}
     */
    errorEvent : {
        get : function() {
            return this._error;
        }
    },
    /**
     * Gets an event that will be raised when the data source either starts or
     * stops loading.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {Event}
     */
    loadingEvent : {
        get : function() {
            return this._loading;
        }
    },

    //These properties are specific to this DataSource.

    /**
     * Gets the array of series names.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {String[]}
     */
    seriesNames : {
        get : function() {
            return this._seriesNames;
        }
    },
    /**
     * Gets or sets the name of the series to display.  WebGL JSON is designed
     * so that only one series is viewed at a time.  Valid values are defined
     * in the seriesNames property.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {String}
     */
    seriesToDisplay : {
        get : function() {
            return this._seriesToDisplay;
        },
        set : function(value) {
            this._seriesToDisplay = value;

            //Iterate over all entities and set their show property
            //to true only if they are part of the current series.
            var collection = this._entityCollection;
            var entities = collection.values;
            collection.suspendEvents();
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];
                entity.show = value === entity.seriesName;
            }
            collection.resumeEvents();
        }
    },
    /**
     * Gets or sets the scale factor applied to the height of each line.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {Number}
     */
    heightScale : {
        get : function() {
            return this._heightScale;
        },
        set : function(value) {
            if (value > 0) {
                throw new Cesium.DeveloperError('value must be greater than 0');
            }
            this._heightScale = value;
        }
    },
    /**
     * Gets whether or not this data source should be displayed.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {Boolean}
     */
    show : {
        get : function() {
            return this._entityCollection;
        },
        set : function(value) {
            this._entityCollection = value;
        }
    },
    /**
     * Gets or sets the clustering options for this data source. This object can be shared between multiple data sources.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {EntityCluster}
     */
    clustering : {
        get : function() {
            return this._entityCluster;
        },
        set : function(value) {
            if (!Cesium.defined(value)) {
                throw new Cesium.DeveloperError('value must be defined.');
            }
            this._entityCluster = value;
        }
    }
});

/**
 * Asynchronously loads the GeoJSON at the provided url, replacing any existing data.
 * @param {Object} url The url to be processed.
 * @returns {Promise} a promise that will resolve when the GeoJSON is loaded.
 */
WebGLGlobeDataSource.prototype.loadUrl = function(url) {
    if (!Cesium.defined(url)) {
        throw new Cesium.DeveloperError('url is required.');
    }

    //Create a name based on the url
    var name = Cesium.getFilenameFromUri(url);

    //Set the name if it is different than the current name.
    if (this._name !== name) {
        this._name = name;
        this._changed.raiseEvent(this);
    }

    //Use 'when' to load the URL into a json object
    //and then process is with the `load` function.
    var that = this;
    return Cesium.Resource.fetchJson(url).then(function(json) {
        return that.load(json, url);
    }).otherwise(function(error) {
        //Otherwise will catch any errors or exceptions that occur
        //during the promise processing. When this happens,
        //we raise the error event and reject the promise.
        this._setLoading(false);
        that._error.raiseEvent(that, error);
        return Cesium.when.reject(error);
    });
};

/**
 * Loads the provided data, replacing any existing data.
 * @param {Array} data The object to be processed.
 */
WebGLGlobeDataSource.prototype.load = function(data) {
    //>>includeStart('debug', pragmas.debug);
    if (!Cesium.defined(data)) {
        throw new Cesium.DeveloperError('data is required.');
    }
    //>>includeEnd('debug');

    //Clear out any data that might already exist.
    this._setLoading(true);
    this._seriesNames.length = 0;
    this._seriesToDisplay = undefined;

    var heightScale = this.heightScale;
    var entities = this._entityCollection;

    //It's a good idea to suspend events when making changes to a
    //large amount of entities.  This will cause events to be batched up
    //into the minimal amount of function calls and all take place at the
    //end of processing (when resumeEvents is called).
    entities.suspendEvents();
    entities.removeAll();

    //WebGL Globe JSON is an array of series, where each series itself is an
    //array of two items, the first containing the series name and the second
    //being an array of repeating latitude, longitude, height values.
    //
    //Here's a more visual example.
    //[["series1",[latitude, longitude, height, ... ]
    // ["series2",[latitude, longitude, height, ... ]]
    // Loop over each series
    for (var x = 0; x < data.length; x++) {
        var series = data[x];
        var seriesName = series[0];
        var coordinates = series[1];

        //Add the name of the series to our list of possible values.
        this._seriesNames.push(seriesName);

        //Make the first series the visible one by default
        var show = x === 0;
        if (show) {
            this._seriesToDisplay = seriesName;
        }

        //Now loop over each coordinate in the series and create
        // our entities from the data.
        for (var i = 0; i < coordinates.length; i += 3) {
            var latitude = coordinates[i];
            var longitude = coordinates[i + 1];
            var height = coordinates[i + 2];

            //Ignore lines of zero height.
            if(height === 0) {
                continue;
            }

            var color = Cesium.Color.fromHsl((0.6 - (height * 0.5)), 1.0, 0.5);
            var surfacePosition = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0);
            var heightPosition = Cesium.Cartesian3.fromDegrees(longitude, latitude, height * heightScale);

            //WebGL Globe only contains lines, so that's the only graphics we create.
            var polyline = new Cesium.PolylineGraphics();
            polyline.material = new Cesium.ColorMaterialProperty(color);
            polyline.width = new Cesium.ConstantProperty(10);
            polyline.followSurface = new Cesium.ConstantProperty(false);
            polyline.positions = new Cesium.ConstantProperty([surfacePosition, heightPosition]);

            //The polyline instance itself needs to be on an entity.
            var entity = new Cesium.Entity({
                id : seriesName + ' index ' + i.toString(),
                show : show,
                polyline : polyline,
                seriesName : seriesName //Custom property to indicate series name
            });

            //Add the entity to the collection.
            entities.add(entity);
        }
    }

    //Once all data is processed, call resumeEvents and raise the changed event.
    entities.resumeEvents();
    this._changed.raiseEvent(this);
    this._setLoading(false);
};

WebGLGlobeDataSource.prototype._setLoading = function(isLoading) {
    if (this._isLoading !== isLoading) {
        this._isLoading = isLoading;
        this._loading.raiseEvent(this, isLoading);
    }
};

//Now that we've defined our own DataSource, we can use it to load
//any JSON data formatted for WebGL Globe.
// var dataSource = new WebGLGlobeDataSource();
//
// dataSource.loadUrl('../Source/SampleData/population909500.json').then(function() {
//
//     //After the initial load, create buttons to let the user switch among series.
//     function createSeriesSetter(seriesName) {
//         return function() {
//             dataSource.seriesToDisplay = seriesName;
//         };
//     }
//
// });

//Create a Viewer instances and add the DataSource.
var viewer = new Cesium.Viewer('cesiumContainer', {
    animation : true,
    timeline : true,
    baseLayerPicker : false
});
viewer.clock.shouldAnimate = true;
//viewer.dataSources.add(dataSource);
//viewer.extend(Cesium.viewerCesiumInspectorMixin);


//Get scene of current viewer
var scene = viewer.scene;
//Get Layers collection from scene
var layerCollections = scene.imageryLayers;
//Add coordinates layer to Cesium viewer
//var CoordinatesProvider = new Cesium.TileCoordinatesImageryProvider();
//var CoordinatesLayer = layerCollections.add(new Cesium.ImageryLayer(CoordinatesProvider));

//Add United States Weather Radar
// var USRadarProvider = new Cesium.WebMapServiceImageryProvider({
//     url : 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?',
//     layers : 'nexrad-n0r',
//     credit : 'Radar data courtesy Iowa Environmental Mesonet',
//     parameters : {
//         transparent : 'true',
//         format : 'image/png'
//     }
// })
// var USRadarLayer = layerCollections.add(new Cesium.ImageryLayer(USRadarProvider));

// Sandcastle.addToggleButton('Limit Enabled', true, function(checked) {
//     if (checked) {
//         viewer.scene.globe.cartographicLimitRectangle = coffeeBeltRectangle;
//     } else {
//         viewer.scene.globe.cartographicLimitRectangle = undefined;
//     }
// });
//
// Sandcastle.addToggleButton('Show Bounds', true, function(checked) {
//     var rectanglesLength = rectangles.length;
//     for (var i = 0; i < rectanglesLength; i++) {
//         var rectangleEntity = rectangles[i];
//         rectangleEntity.show = checked;
//     }
// });

var imageryLayers = viewer.imageryLayers;

var viewModel = {
    layers : [],
    baseLayers : [],
    upLayer : null,
    downLayer : null,
    selectedLayer : null,
    isSelectableLayer : function(layer) {
        return this.baseLayers.indexOf(layer) >= 0;
    },
    raise : function(layer, index) {
        imageryLayers.raise(layer);
        viewModel.upLayer = layer;
        viewModel.downLayer = viewModel.layers[Math.max(0, index - 1)];
        updateLayerList();
        window.setTimeout(function() { viewModel.upLayer = viewModel.downLayer = null; }, 10);
    },
    lower : function(layer, index) {
        imageryLayers.lower(layer);
        viewModel.upLayer = viewModel.layers[Math.min(viewModel.layers.length - 1, index + 1)];
        viewModel.downLayer = layer;
        updateLayerList();
        window.setTimeout(function() { viewModel.upLayer = viewModel.downLayer = null; }, 10);
    },
    canRaise : function(layerIndex) {
        return layerIndex > 0;
    },
    canLower : function(layerIndex) {
        return layerIndex >= 0 && layerIndex < imageryLayers.length - 1;
    }
};
var baseLayers = viewModel.baseLayers;

Cesium.knockout.track(viewModel);

function setupLayers() {
    // Create all the base layers that this example will support.
    // These base layers aren't really special.  It's possible to have multiple of them
    // enabled at once, just like the other layers, but it doesn't make much sense because
    // all of these layers cover the entire globe and are opaque.
    addBaseLayerOption(
        'None',
        undefined); // the current base layer
    addBaseLayerOption(
        'wind',
        function () {
            var dataSource = new WebGLGlobeDataSource();
            dataSource.loadUrl('../Source/SampleData/population909500.json').then(function() {

                //After the initial load, create buttons to let the user switch among series.
                function createSeriesSetter(seriesName) {
                    return function() {
                        dataSource.seriesToDisplay = seriesName;
                    };
                }

            });
            viewer.dataSources.add(dataSource);
        },
        );
    addBaseLayerOption(
        'weather',
        new Cesium.BingMapsImageryProvider({
            url : 'https://dev.virtualearth.net',
            mapStyle: Cesium.BingMapsStyle.ROAD
        }));
    addBaseLayerOption(
        'temperature',
        new Cesium.ArcGisMapServerImageryProvider({
            url : 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
        }));
    addBaseLayerOption(
        'pressure',
        Cesium.createOpenStreetMapImageryProvider());
    addBaseLayerOption(
        'hurricanes',
        Cesium.createOpenStreetMapImageryProvider({
            url : 'https://otile1-s.mqcdn.com/tiles/1.0.0/osm/'
        }));
    addBaseLayerOption(
        'humidity',
        Cesium.createOpenStreetMapImageryProvider({
            url : 'https://stamen-tiles.a.ssl.fastly.net/watercolor/',
            fileExtension: 'jpg',
            credit: 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under CC BY SA.'
        }));

    // Create the additional layers
    // addAdditionalLayerOption(
    //     'wind',
    //     new Cesium.WebMapServiceImageryProvider({
    //         url : 'https://mesonet.agron.iastate.edu/cgi-bin/wms/goes/conus_ir.cgi?',
    //         layers : 'goes_conus_ir',
    //         credit : 'Infrared data courtesy Iowa Environmental Mesonet',
    //         parameters : {
    //             transparent : 'true',
    //             format : 'image/png'
    //         }
    //     }));
    addAdditionalLayerOption(
        'United States Weather Radar',
        new Cesium.WebMapServiceImageryProvider({
            url : 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?',
            layers : 'nexrad-n0r',
            credit : 'Radar data courtesy Iowa Environmental Mesonet',
            parameters : {
                transparent : 'true',
                format : 'image/png'
            }
        }));
    // addAdditionalLayerOption(
    //     'temperature',
    //     Cesium.createTileMapServiceImageryProvider({
    //         url : '../images/cesium_maptiler/Cesium_Logo_Color'
    //     }),
    //     0.2);
    // addAdditionalLayerOption(
    //     'Pressure',
    //     new Cesium.SingleTileImageryProvider({
    //         url : '../images/Cesium_Logo_overlay.png',
    //         rectangle : Cesium.Rectangle.fromDegrees(-115.0, 38.0, -107, 39.75)
    //     }),
    //     1.0);
    addAdditionalLayerOption(
        'Grid',
        new Cesium.GridImageryProvider(), 1.0, false);
    addAdditionalLayerOption(
        'Tile Coordinates',
        new Cesium.TileCoordinatesImageryProvider(), 1.0, false);
}

function addBaseLayerOption(name, imageryProvider) {
    var layer;
    if (typeof imageryProvider === 'undefined') {
        layer = imageryLayers.get(0);
        viewModel.selectedLayer = layer;
    } else {
        layer = new Cesium.ImageryLayer(imageryProvider);
    }

    layer.name = name;
    baseLayers.push(layer);
}

function addAdditionalLayerOption(name, imageryProvider, alpha, show) {
    var layer = imageryLayers.addImageryProvider(imageryProvider);
    layer.alpha = Cesium.defaultValue(alpha, 0.5);
    layer.show = Cesium.defaultValue(show, true);
    layer.name = name;
    Cesium.knockout.track(layer, ['alpha', 'show', 'name']);
}

function updateLayerList() {
    var numLayers = imageryLayers.length;
    viewModel.layers.splice(0, viewModel.layers.length);
    for (var i = numLayers - 1; i >= 0; --i) {
        viewModel.layers.push(imageryLayers.get(i));
    }
}

setupLayers();
updateLayerList();

//Bind the viewModel to the DOM elements of the UI that call for it.
var toolbar = document.getElementById('toolbar');
Cesium.knockout.applyBindings(viewModel, toolbar);

Cesium.knockout.getObservable(viewModel, 'selectedLayer').subscribe(function(baseLayer) {
    // Handle changes to the drop-down base layer selector.
    var activeLayerIndex = 0;
    var numLayers = viewModel.layers.length;
    for (var i = 0; i < numLayers; ++i) {
        if (viewModel.isSelectableLayer(viewModel.layers[i])) {
            activeLayerIndex = i;
            break;
        }
    }
    var activeLayer = viewModel.layers[activeLayerIndex];
    var show = activeLayer.show;
    var alpha = activeLayer.alpha;
    imageryLayers.remove(activeLayer, false);
    imageryLayers.add(baseLayer, numLayers - activeLayerIndex - 1);
    baseLayer.show = show;
    baseLayer.alpha = alpha;
    updateLayerList();
});