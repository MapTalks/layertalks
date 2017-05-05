maptalks.symbolizer.VectorPathMarkerSymbolizer = maptalks.symbolizer.ImageMarkerSymbolizer.extend({

    initialize:function (symbol, geometry, painter) {
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
        this._url = [maptalks.Geometry.getMarkerPathBase64(symbol), symbol['markerWidth'], symbol['markerHeight']];
        this.style = this._defineStyle(this.translate());
        //IE must have a valid width and height to draw a svg image
        //otherwise, error will be thrown
        if (maptalks.Util.isNil(this.style['markerWidth'])) {
            this.style['markerWidth'] = 80;
        }
        if (maptalks.Util.isNil(this.style['markerHeight'])) {
            this.style['markerHeight'] = 80;
        }
    },

    _prepareContext: function () {
        //for VectorPathMarkerSymbolizer, opacity is already added into SVG element.
    },

    _getImage:function (resources) {
        if (resources && resources.isResourceLoaded(this._url)) {
            return resources.getImage(this._url);
        }
        var image = new Image();
        image.src = this._url[0];
        if (resources) {
            resources.addResource(this._url, image);
        }
        return image;
        // return resources ? resources.getImage(this._url) : null;
    }
});


maptalks.symbolizer.VectorPathMarkerSymbolizer.test = function (symbol) {
    if (!symbol) {
        return false;
    }
    if (maptalks.Util.isNil(symbol['markerFile']) && symbol['markerType'] === 'path') {
        return true;
    }
    return false;
};