
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
    var CityLatitudeLongitude = [[49.24966,-123.119339],[45.523449,-122.676208],[37.774929,-122.419418],
    [47.606209,-122.332069],[34.052231,-118.243683],[32.715328,-117.157257],[36.174969,-115.137222],
    [33.44838,-112.074043],[35.084492,-106.651138],[39.739151,-104.984703],[29.42412,-98.493629],[32.783058,-96.806671],
    [29.763281,-95.363274],[39.099731,-94.578568],[44.979969,-93.26384],[38.62727,-90.197891],[41.850029,-87.650047],
    [36.16589,-86.784439],[39.768379,-86.158043],[33.749001,-84.387978],[42.331429,-83.045753],[30.33218,-81.655647],
    [35.227089,-80.843132],[25.774269,-80.193657],[40.44062,-79.995888],[43.700111,-79.416298],[39.952339,-75.163788],
    [40.714272,-74.005966],[45.508839,-73.587807],[42.358429,-71.059769],[31.25181,34.791302],[32.083328,34.799999],
    [29.55805,34.948212],[32.815559,34.98917],[33.005859,35.09409],[31.769039,35.216331]];

    var combineData = new Array(); 
    for (var x = 0; x < data.length; x++) {
        var series = data[x];
        var seriesName = series[0];
        var coordinates = series[1];
        for (var i = 0; i < coordinates.length; i++){
            for(var j = 0; j < CityLatitudeLongitude.length; j++){
                combineData[j] = [CityLatitudeLongitude[j][0],CityLatitudeLongitude[j][1],coordinates[i]];
            }
        }
        console.log(combineData);
        combineData = reduceDimension(combineData);
        //console.log(combineData);
        //Add the name of the series to our list of possible values.
        this._seriesNames.push(seriesName);

        //Make the first series the visible one by default
        var show = x === 0;
        if (show) {
            this._seriesToDisplay = seriesName;
        }

        //Now loop over each coordinate in the series and create
        // our entities from the data.
        for (var i = 0; i < combineData.length; i += 3) {

            var latitude = combineData[i];
            var longitude = combineData[i + 1];
            var height = combineData[i + 2];

            //Ignore lines of zero height.
            if(height === 0) {
                continue;
            }

            var color = Cesium.Color.fromHsl((0.6 - (height * 0.5)), 1.0, 0.5);
            var surfacePosition = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0);
            var heightPosition = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0.01*height * heightScale);

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
//any JSON data formatted for WebGL Globe.'../Source/SampleData/population2016.json'


//Create a Viewer instances and add the DataSource.
var viewer = new Cesium.Viewer('cesiumContainer', {
    //animation : true,
    shouldAnimate : true,
    timeline : true,
    baseLayerPicker : false
});
//viewer.clock.shouldAnimate = true;
//viewer.dataSources.add(dataSource);
function dataCallback(interval, index) {
    var time;
    if (index === 0) { // leading
        time = Cesium.JulianDate.toIso8601(interval.stop);
    } else {
        time = Cesium.JulianDate.toIso8601(interval.start);
    }

    return {
        Time: time
    };
}

// var times = Cesium.TimeIntervalCollection.fromIso8601({
//     iso8601: '2015-07-30/2017-06-16/P1D',
//     leadingInterval: true,
//     trailingInterval: true,
//     isStopIncluded: false, // We want stop time to be part of the trailing interval
//     dataCallback: dataCallback
// });

//Get scene of current viewer
var scene = viewer.scene;
//Get Layers collection from scene
var layerCollections = scene.imageryLayers;


var imageryLayers = viewer.imageryLayers;

var viewModel = {
    layers : [],
    baseLayers : [],
    upLayer : null,
    downLayer : null,
    selectedLayer : null,
    isSelectableLayer : function(layer) {
        changeDataType(layer.name);
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
        'weather',
        new Cesium.createWorldImagery({
            //style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS
        }));
    addBaseLayerOption(
        'temperature',
        new Cesium.createWorldImagery({
            //style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS
        }));
    addBaseLayerOption(
        'pressure',
        new Cesium.createWorldImagery({
            //style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS
        }));
    addBaseLayerOption(
        'hurricanes',
         new Cesium.WebMapTileServiceImageryProvider({
            url : 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/AMSR2_Snow_Water_Equivalent/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png',
            layer : 'AMSR2_Snow_Water_Equivalent',
            style : 'default',
            tileMatrixSetID : '2km',
            maximumLevel : 5,
            format : 'image/png',
            clock: viewer.clock,
            times: times,
            credit : 'NASA Global Imagery Browse Services for EOSDIS'
        }));

    addBaseLayerOption(
        'humidity',
        new Cesium.createWorldImagery({
            //style: Cesium.IonWorldImageryStyle.AERIAL_WITH_LABELS
        }));

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
        }),1.0,false);

    addAdditionalLayerOption(
        'Grid',
        new Cesium.GridImageryProvider(), 1.0, false);

    addAdditionalLayerOption(
        'Tile Coordinates',
        new Cesium.TileCoordinatesImageryProvider(), 1.0, false);
}

function addBaseLayerOption(name, imageryProvider,dataSource) {
    var layer;
    if (typeof imageryProvider === 'undefined') {
        layer = imageryLayers.get(0);
        viewModel.selectedLayer = layer;
    }else {
        if(imageryProvider._layer==="AMSR2_Snow_Water_Equivalent"){
            setAnimationData(imageryProvider);
        }
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

var dataSource = new WebGLGlobeDataSource();
function getResourceData(urlString){
    dataSource.loadUrl(urlString).then(function() {
        //After the initial load, create buttons to let the user switch among series.
        function createSeriesSetter(seriesName) {
            return function() {
                dataSource.seriesToDisplay = seriesName;
            };
        }
    });
}
function changeDataType(layerName){
    
    if(layerName == "weather"){
        viewer.dataSources.remove(dataSource);
        getResourceData('../Source/SampleData/population2016.json');
        viewer.dataSources.add(dataSource);
    }else if (layerName == "temperature") {
        viewer.dataSources.remove(dataSource);
        getResourceData('../Source/SampleData/population2017.json');
        viewer.dataSources.add(dataSource);

    }else if (layerName == "hurricanes") {
        viewer.dataSources.remove(dataSource);
        getResourceData('../Source/SampleData/population2018.json');
        viewer.dataSources.add(dataSource);

    }else if (layerName == "humidity") {
        viewer.dataSources.remove(dataSource);
        getResourceData('../Source/SampleData/humidity.json');
        viewer.dataSources.add(dataSource);

    }
    
}

function setAnimationData(layerObject){
    var imageryLayers = new Cesium.ImageryLayer(layerObject);
    layerObject.readyPromise
        .then(function() {
            var start = Cesium.JulianDate.fromIso8601('2015-07-30');
            var stop = Cesium.JulianDate.fromIso8601('2017-06-17');

            viewer.timeline.zoomTo(start, stop);

            var clock = viewer.clock;
            clock.startTime = start;
            clock.stopTime = stop;
            clock.currentTime = start;
            clock.clockRange = Cesium.ClockRange.LOOP_STOP;
            clock.multiplier = 86400;
        });

}

function reduceDimension(arr) {
    var reduced = [];
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < arr[i].length; j++) {
            reduced.push(arr[i][j]);
        }
    }
    return reduced;
}

