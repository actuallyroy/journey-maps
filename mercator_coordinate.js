// @flow

// import LngLat, {earthCircumference} from '../geo/lng_lat.js';
// import type {LngLatLike} from '../geo/lng_lat.js';


export const earthRadius = 6371008.8;

/*
 * The average circumference of the earth in meters.
 */
export const earthCircumference = 2 * Math.PI * earthRadius;
/*
 * The circumference at a line of latitude in meters.
 */
export function circumferenceAtLatitude(latitude) {
    return earthCircumference * Math.cos(latitude * Math.PI / 180);
}

export function mercatorXfromLng(lng) {
    return (180 + lng) / 360;
}

export function mercatorYfromLat(lat) {
    return (180 - (180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)))) / 360;
}

export function mercatorZfromAltitude(altitude, lat) {
    return altitude / circumferenceAtLatitude(lat);
}

export function lngFromMercatorX(x) {
    return x * 360 - 180;
}

export function latFromMercatorY(y) {
    const y2 = 180 - y * 360;
    return 360 / Math.PI * Math.atan(Math.exp(y2 * Math.PI / 180)) - 90;
}

export function altitudeFromMercatorZ(z, y) {
    return z * circumferenceAtLatitude(latFromMercatorY(y));
}

export const MAX_MERCATOR_LATITUDE = 85.051129;

/**
 * Determine the Mercator scale factor for a given latitude, see
 * https://en.wikipedia.org/wiki/Mercator_projection#Scale_factor
 *
 * At the equator the scale factor will be 1, which increases at higher latitudes.
 *
 * @param {number} lat Latitude
 * @returns {number} scale factor
 * @private
 */
export function mercatorScale(lat) {
    return 1 / Math.cos(lat * Math.PI / 180);
}

/**
 * A `MercatorCoordinate` object represents a projected three dimensional position.
 *
 * `MercatorCoordinate` uses the web mercator projection ([EPSG:3857](https://epsg.io/3857)) with slightly different units:
 * - the size of 1 unit is the width of the projected world instead of the "mercator meter"
 * - the origin of the coordinate space is at the north-west corner instead of the middle.
 *
 * For example, `MercatorCoordinate(0, 0, 0)` is the north-west corner of the mercator world and
 * `MercatorCoordinate(1, 1, 0)` is the south-east corner. If you are familiar with
 * [vector tiles](https://github.com/mapbox/vector-tile-spec) it may be helpful to think
 * of the coordinate space as the `0/0/0` tile with an extent of `1`.
 *
 * The `z` dimension of `MercatorCoordinate` is conformal. A cube in the mercator coordinate space would be rendered as a cube.
 *
 * @param {number} x The x component of the position.
 * @param {number} y The y component of the position.
 * @param {number} z The z component of the position.
 * @example
 * const nullIsland = new mapboxgl.MercatorCoordinate(0.5, 0.5, 0);
 *
 * @see [Example: Add a custom style layer](https://www.mapbox.com/mapbox-gl-js/example/custom-style-layer/)
 */
class MercatorCoordinate {
    x;
    y;
    z;

    constructor(x, y, z = 0) {
        this.x = +x;
        this.y = +y;
        this.z = +z;
    }

    /**
     * Project a `LngLat` to a `MercatorCoordinate`.
     *
     * @param {LngLatLike} lngLatLike The location to project.
     * @param {number} altitude The altitude in meters of the position.
     * @returns {MercatorCoordinate} The projected mercator coordinate.
     * @example
     * const coord = mapboxgl.MercatorCoordinate.fromLngLat({lng: 0, lat: 0}, 0);
     * console.log(coord); // MercatorCoordinate(0.5, 0.5, 0)
     */
    // static fromLngLat(lngLatLike: LngLatLike, altitude = 0): MercatorCoordinate {
    //     const lngLat = LngLat.convert(lngLatLike);

    //     return new MercatorCoordinate(
    //             mercatorXfromLng(lngLat.lng),
    //             mercatorYfromLat(lngLat.lat),
    //             mercatorZfromAltitude(altitude, lngLat.lat));
    // }

    /**
     * Returns the `LngLat` for the coordinate.
     *
     * @returns {LngLat} The `LngLat` object.
     * @example
     * const coord = new mapboxgl.MercatorCoordinate(0.5, 0.5, 0);
     * const lngLat = coord.toLngLat(); // LngLat(0, 0)
     */
    // toLngLat(): LngLat {
    //     return new LngLat(
    //             lngFromMercatorX(this.x),
    //             latFromMercatorY(this.y));
    // }

    /**
     * Returns the altitude in meters of the coordinate.
     *
     * @returns {number} The altitude in meters.
     * @example
     * const coord = new mapboxgl.MercatorCoordinate(0, 0, 0.02);
     * coord.toAltitude(); // 6914.281956295339
     */
    toAltitude() {
        return altitudeFromMercatorZ(this.z, this.y);
    }

}

export default MercatorCoordinate;
