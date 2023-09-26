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

import {ComplexFormFieldStrategy} from './complex/ComplexFormFieldStrategy';
import {EitherFormFieldStrategy} from './either/EitherFormFieldStrategy';
import {EnumerationFormFieldStrategy} from './enumeration/EnumerationFormFieldStrategy';
import {BooleanFormFieldStrategy} from './boolean/BooleanFormFieldStrategy';
import {TextFormFieldStrategy} from './text/TextFormFieldStrategy';
import {TextAreaFormFieldStrategy} from './textArea/TextAreaFormFieldStrategy';
import {NumberFormFieldStrategy} from './number/NumberFormFieldStrategy';
import {DateFormFieldStrategy} from './date/DateFormFieldStrategy';
import {DateTimeFormFieldStrategy} from './dateTime/DateTimeFormFieldStrategy';
import {DefaultFormFieldStrategy} from './default/DefaultFormFieldStrategy';
import {DurationFormFieldStrategy} from './duration/DurationFormFieldStrategy';
import {TimeFormFieldStrategy} from './time/TimeFormFieldStrategy';
import {DatePartialFormFieldStrategy} from './datePartial/DatePartialFormFieldStrategy';
import {ListFormFieldStrategy} from './list/ListFormFieldStrategy';
import {StructuredValueFormFieldStrategy} from './structuredValue/StructuredValueFormFieldStrategy';

export const FORM_FIELD_STRATEGIES = [
    ComplexFormFieldStrategy,
    EitherFormFieldStrategy,
    ListFormFieldStrategy,
    StructuredValueFormFieldStrategy,
    EnumerationFormFieldStrategy,
    BooleanFormFieldStrategy,
    TextFormFieldStrategy,
    TextAreaFormFieldStrategy,
    NumberFormFieldStrategy,
    DateFormFieldStrategy,
    DateTimeFormFieldStrategy,
    DurationFormFieldStrategy,
    TimeFormFieldStrategy,
    DatePartialFormFieldStrategy,
];
export const FORM_FIELD_DEFAULT_STRATEGY = DefaultFormFieldStrategy;
