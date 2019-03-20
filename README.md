# Data Visualization

This Web-based 3D Earth Weather Simulation System will use National Weather Service(NWS), NASA, National Hurricane Center(NHC) data, such like radar cloud, hurricane and storm as the data source to demonstrate and visualize weather data in this system. 

**Cesium version**: [1.45](https://cesiumjs.org/downloads/).

**License**: Apache 2.0.  Free for commercial and non-commercial use.  See [LICENSE.md](LICENSE.md).

This application is intended to introduce the main features of Cesium in context, but it is by no means exhaustive. Feel free to fork and modify this example however you'd like.

Local server
------------

This app comes with a simple server ([`server.js`](./server.js)), but can be served through any means.

To use the packaged server:

* Install [node.js](http://nodejs.org/)
* From the `cesium-workshop` root directory, run
```
npm install
node server.js
```

Browse to `http://localhost:8080/`

>Have python installed?  If so, from the `cesium-workshop` root directory run
>```
>python -m SimpleHTTPServer 8080
>```
>(Starting with Python 3, use `python -m http.server 8080`).
>
>Browse to `http://localhost:8080/`

What's here?
------------

* [index.html](ddddd.html) - A simple HTML page. Run a local web server, and browse to index.html to run your app, which will show our sample application.
* [Source](Source/) - Contains [App.js](Source/App.js) which is referenced from index.html.  This is where the app's code goes.
* [ThirdParty](ThirdParty/) - A directory for third-party libraries, which here includes just Cesium.
* [server.js](server.js) - A simple node.js server for serving your Cesium app.  See the **Local server** section.
* [package.json](package.json) - Dependencies for the node.js server.
* [LICENSE](LICENSE.md) - A license file already referencing Cesium as a third-party.  This starter app is licensed with [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0.html) (free for commercial and non-commercial use).  You can, of course, license your code however you want.
* [.gitignore](.gitignore) - A small list of files not to include in the git repo.  Add to this as needed.

Cesium resources
----------------

* [Reference Documentation](http://cesiumjs.org/refdoc.html) : A complete guide to the Cesium API containing many code snippets.
* [Sandcastle](http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html) : A live-coding environment with a large gallery of code examples.
* [Tutorials](http://cesiumjs.org/tutorials.html) : Detailed introductions to areas of Cesium development.
* [Cesium Forum](http://cesiumjs.org/forum.html) : A resource for asking and answering Cesium-related questions.
