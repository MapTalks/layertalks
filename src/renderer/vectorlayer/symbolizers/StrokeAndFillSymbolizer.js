import { isArray, isArrayHasData, getValueOrDefault } from 'core/util';
import { isGradient as checkGradient } from 'core/util/style';
import Canvas from 'utils/Canvas';
import Coordinate from 'geo/Coordinate';
import PointExtent from 'geo/PointExtent';
import { Marker, LineString, Polygon } from 'geometry';
import CanvasSymbolizer from './CanvasSymbolizer';

export default class StrokeAndFillSymbolizer extends CanvasSymbolizer {

    static test(symbol, geometry) {
        if (!symbol) {
            return false;
        }
        if (geometry && (geometry instanceof Marker)) {
            return false;
        }
        for (var p in symbol) {
            var f = p.slice(0, 4);
            if (f === 'line' || f === 'poly') {
                return true;
            }
        }
        return false;
    }

    constructor(symbol, geometry, painter) {
        super();
        this.symbol = symbol;
        this.geometry = geometry;
        this.painter = painter;
        if (geometry instanceof Marker) {
            return;
        }
        this.style = this._defineStyle(this.translate());
    }

    symbolize(ctx, resources) {
        if (this.geometry instanceof Marker) {
            return;
        }
        var style = this.style;
        if (style['polygonOpacity'] === 0 && style['lineOpacity'] === 0) {
            return;
        }
        var paintParams = this._getPaintParams();
        if (!paintParams) {
            return;
        }
        this._prepareContext(ctx);
        var isGradient = checkGradient(style['lineColor']),
            isPath = (this.geometry.constructor === Polygon) || (this.geometry instanceof LineString);
        if (isGradient && (style['lineColor']['places'] || !isPath)) {
            style['lineGradientExtent'] = this.getPainter().getContainerExtent()._expand(style['lineWidth']);
        }
        if (checkGradient(style['polygonFill'])) {
            style['polygonGradientExtent'] = this.getPainter().getContainerExtent();
        }

        var points = paintParams[0],
            isSplitted = (this.geometry instanceof Polygon && points.length > 1 && isArray(points[0][0])) ||
            (this.geometry instanceof LineString && points.length > 1 && isArray(points[0]));
        var params;
        if (isSplitted) {
            for (var i = 0; i < points.length; i++) {
                Canvas.prepareCanvas(ctx, style, resources);
                if (isGradient && isPath && !style['lineColor']['places']) {
                    this._createGradient(ctx, points[i], style['lineColor']);
                }
                params = [ctx, points[i]];
                if (paintParams.length > 1) {
                    params.push.apply(params, paintParams.slice(1));
                }
                params.push(style['lineOpacity'], style['polygonOpacity'], style['lineDasharray']);
                this.geometry._paintOn.apply(this.geometry, params);
            }
        } else {
            Canvas.prepareCanvas(ctx, style, resources);
            if (isGradient && isPath && !style['lineColor']['places']) {
                this._createGradient(ctx, points, style['lineColor']);
            }
            params = [ctx];
            params.push.apply(params, paintParams);
            params.push(style['lineOpacity'], style['polygonOpacity'], style['lineDasharray']);
            this.geometry._paintOn.apply(this.geometry, params);
        }

        if (ctx.setLineDash && isArrayHasData(style['lineDasharray'])) {
            ctx.setLineDash([]);
        }
    }

    get2DExtent() {
        if (this.geometry instanceof Marker) {
            return null;
        }
        var map = this.getMap();
        var extent = this.geometry._getPrjExtent();
        if (!extent) {
            return null;
        }
        // this ugly implementation is to improve perf as we can
        // it tries to avoid creating instances to save cpu consumption.
        if (!this._extMin || !this._extMax) {
            this._extMin = new Coordinate(0, 0);
            this._extMax = new Coordinate(0, 0);
        }
        this._extMin.x = extent['xmin'];
        this._extMin.y = extent['ymin'];
        this._extMax.x = extent['xmax'];
        this._extMax.y = extent['ymax'];
        var min = map._prjToPoint(this._extMin),
            max = map._prjToPoint(this._extMax);
        if (!this._pxExtent) {
            this._pxExtent = new PointExtent(min, max);
        } else {
            if (min.x < max.x) {
                this._pxExtent['xmin'] = min.x;
                this._pxExtent['xmax'] = max.x;
            } else {
                this._pxExtent['xmax'] = min.x;
                this._pxExtent['xmin'] = max.x;
            }
            if (min.y < max.y) {
                this._pxExtent['ymin'] = min.y;
                this._pxExtent['ymax'] = max.y;
            } else {
                this._pxExtent['ymax'] = min.y;
                this._pxExtent['ymin'] = max.y;
            }
        }
        return this._pxExtent._expand(this.style['lineWidth'] / 2);
    }

    _getPaintParams() {
        return this.getPainter().getPaintParams();
    }

    translate() {
        var s = this.symbol;
        var result = {
            'lineColor': getValueOrDefault(s['lineColor'], '#000'),
            'lineWidth': getValueOrDefault(s['lineWidth'], 2),
            'lineOpacity': getValueOrDefault(s['lineOpacity'], 1),
            'lineDasharray': getValueOrDefault(s['lineDasharray'], []),
            'lineCap': getValueOrDefault(s['lineCap'], 'butt'), //“butt”, “square”, “round”
            'lineJoin': getValueOrDefault(s['lineJoin'], 'miter'), //“bevel”, “round”, “miter”
            'linePatternFile': getValueOrDefault(s['linePatternFile'], null),
            'polygonFill': getValueOrDefault(s['polygonFill'], null),
            'polygonOpacity': getValueOrDefault(s['polygonOpacity'], 1),
            'polygonPatternFile': getValueOrDefault(s['polygonPatternFile'], null)
        };
        if (result['lineWidth'] === 0) {
            result['lineOpacity'] = 0;
        }
        // fill of arrow
        if ((this.geometry instanceof LineString) && !result['polygonFill']) {
            result['polygonFill'] = result['lineColor'];
        }
        return result;
    }

    _createGradient(ctx, points, lineColor) {
        var len = points.length;
        var grad = ctx.createLinearGradient(points[0].x, points[0].y, points[len - 1].x, points[len - 1].y);
        lineColor['colorStops'].forEach(function (stop) {
            grad.addColorStop.apply(grad, stop);
        });
        ctx.strokeStyle = grad;
    }

}
