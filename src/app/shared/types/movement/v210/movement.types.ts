/** Generated form ESMF JS SDK Angular Schematics - PLEASE DO NOT CHANGE IT **/

export interface MultiLanguageText {
    /** key defines the locale. Value is the translated text for that locale. */
    [key: string]: string;
}

/**
 * Aspect for movement information
 */
export interface Movement {
    /**
     * Flag indicating whether the asset is currently moving
     */
    isMoving: boolean;
    /**
     * Indicates a position
     */
    position: SpatialPosition;
    /**
     * speed of vehicle
     */
    speed: number;
    /**
     * Indicates if the speed limit is adhered to.
     */
    speedLimitWarning: TrafficLight;
}

/**
 * Represents latitude, longitude and altitude information in the WGS84 geodetic reference datum
 */
export interface SpatialPosition {
    /**
     * latitude coordinate in space (WGS84)
     */
    latitude: number;
    /**
     * longitude coordinate in space (WGS84)
     */
    longitude: number;
    /**
     * Elevation above sea level zero
     */
    altitude?: number;
}

/**
 * Represents if speed of position change is within specification (green), within tolerance (yellow), or outside specification (red).
 */
export enum TrafficLight {
    Green = 'green',
    Yellow = 'yellow',
    Red = 'red',
}
