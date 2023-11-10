/*
 * Copyright (c) 2023 Robert Bosch Manufacturing Solutions GmbH
 *
 * See the AUTHORS file(s) distributed with this work for
 * additional information regarding authorship.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

export interface MultiLanguageText {
    /** key defines the locale. Value is the translated text for that locale. */
    [key: string]: string;
}

/** Aspect for movement information */
export interface Movement {
    /** Flag indicating whether the asset is currently moving */
    isMoving: boolean;
    /** Indicates a position */
    position: SpatialPosition;
    /** speed of vehicle */
    speed: number;
    /** Indicates if the speed limit is adhered to. */
    speedLimitWarning: TrafficLight;
}

/** Represents latitude, longitude and altitude information in the WGS84 geodetic reference datum */
export interface SpatialPosition {
    /** latitude coordinate in space (WGS84) */
    latitude: number;
    /** longitude coordinate in space (WGS84) */
    longitude: number;
    /** Elevation above sea level zero */
    altitude?: number;
}

/** Represents if speed of position change is within specification (green), within tolerance (yellow), or outside specification (red). */
export enum TrafficLight {
    Green = 'green',
    Yellow = 'yellow',
    Red = 'red',
}
