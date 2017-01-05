'use strict';

const ImageSource = require('./image_source');
const window = require('../util/window');

/**
 * A data source containing content copied from an HTML canvas.
 * (See the [Style Specification](https://www.mapbox.com/mapbox-gl-style-spec/#sources-canvas) for detailed documentation of options.)
 * @interface CanvasSource
 * @example
 * // add to map
 * map.addSource('some id', {
 *    type: 'canvas',
 *    canvas: 'idOfMyHTMLCanvas',
 *    animate: true,
 *    coordinates: [
 *        [-76.54, 39.18],
 *        [-76.52, 39.18],
 *        [-76.52, 39.17],
 *        [-76.54, 39.17]
 *    ]
 * });
 *
 * // update
 * var mySource = map.getSource('some id');
 * mySource.setCoordinates([
 *     [-76.54335737228394, 39.18579907229748],
 *     [-76.52803659439087, 39.1838364847587],
 *     [-76.5295386314392, 39.17683392507606],
 *     [-76.54520273208618, 39.17876344106642]
 * ]);
 *
 * map.removeSource('some id');  // remove
 * @see [Add a canvas (TODO: this page does not yet exist)](https://www.mapbox.com/mapbox-gl-js/example/canvas-on-a-map/)
 */
class CanvasSource extends ImageSource {

    constructor(id, options, dispatcher, eventedParent) {
        super(id, options, dispatcher, eventedParent);
        this.options = options;
        this.animate = options.hasOwnProperty('animate') ? options.animate : true;
        this.resize = false;
    }

    load() {
        this.canvas = this.canvas || window.document.getElementById(this.options.canvas);
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        if (this._hasInvalidDimensions(this.canvas)) return this.fire('error', new Error('Canvas dimensions cannot be less than or equal to zero.'));

        let loopID;

        this.play = function() {
            loopID = this.map.style.animationLoop.set(Infinity);
            this.map._rerender();
        };

        this.pause = function() {
            this.map.style.animationLoop.cancel(loopID);
        };

        this._finishLoading();
    }

    /**
     * Returns the HTML `canvas` element.
     *
     * @returns {HTMLCanvasElement} The HTML `canvas` element.
     */
    getCanvas() {
        return this.canvas;
    }

    onAdd(map) {
        if (this.map) return;
        this.map = map;
        this.load();
        if (this.canvas) {
            if (this.animate) this.play();
            this.setCoordinates(this.coordinates);
        }
    }

    /**
     * Sets the canvas's coordinates and re-renders the map.
     *
     * @method setCoordinates
     * @param {Array<Array<number>>} coordinates Four geographical coordinates,
     *   represented as arrays of longitude and latitude numbers, which define the corners of the canvas.
     *   The coordinates start at the top left corner of the canvas and proceed in clockwise order.
     *   They do not have to represent a rectangle.
     * @returns {CanvasSource} this
     */
    // setCoordinates inherited from ImageSource

    prepare() {
        if (this.canvas.width !== this.width) {
            this.width = this.canvas.width;
            this.resize = true;
        }
        if (this.canvas.height !== this.height) {
            this.height = this.canvas.height;
            this.resize = true;
        }
        if (this._hasInvalidDimensions()) {
            return this.fire('error', new Error('Canvas dimensions cannot be less than or equal to zero.'));
        }

        if (!this.tile) return; // not enough data for current position
        this._prepareImage(this.map.painter.gl, this.canvas, this.resize);
        this.resize = false;
    }

    serialize() {
        return {
            type: 'canvas',
            canvas: this.canvas,
            coordinates: this.coordinates
        };
    }

    _hasInvalidDimensions() {
        for (const x of [this.canvas.width, this.canvas.height]) {
            if (isNaN(x) || x <= 0) return true;
        }
        return false;
    }
}

module.exports = CanvasSource;
