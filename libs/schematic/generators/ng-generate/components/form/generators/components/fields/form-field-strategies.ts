/*
 * Copyright (c) 2024 Robert Bosch Manufacturing Solutions GmbH
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

import {BooleanFormFieldStrategy} from './boolean/BooleanFormFieldStrategy';
import {ComplexFormFieldStrategy} from './complex/ComplexFormFieldStrategy';
import {DateFormFieldStrategy} from './date/DateFormFieldStrategy';
import {DatePartialFormFieldStrategy} from './datePartial/DatePartialFormFieldStrategy';
import {DateTimeFormFieldStrategy} from './dateTime/DateTimeFormFieldStrategy';
import {DefaultFormFieldStrategy} from './default/DefaultFormFieldStrategy';
import {DurationFormFieldStrategy} from './duration/DurationFormFieldStrategy';
import {EitherFormFieldStrategy} from './either/EitherFormFieldStrategy';
import {EnumerationFormFieldStrategy} from './enumeration/EnumerationFormFieldStrategy';
import {ListFormFieldStrategy} from './list/ListFormFieldStrategy';
import {NumberFormFieldStrategy} from './number/NumberFormFieldStrategy';
import {StructuredValueFormFieldStrategy} from './structuredValue/StructuredValueFormFieldStrategy';
import {TextFormFieldStrategy} from './text/TextFormFieldStrategy';
import {TextAreaFormFieldStrategy} from './textArea/TextAreaFormFieldStrategy';
import {TimeFormFieldStrategy} from './time/TimeFormFieldStrategy';

// The order matters:
// Some of the "isTargetStrategy" methods have more strict checks than others,
// the checks will be made in the same order as defined by "FORM_FIELD_STRATEGIES" array,
// from more strict to more generic ones.
export const FORM_FIELD_STRATEGIES = [
  EitherFormFieldStrategy,
  ListFormFieldStrategy,
  StructuredValueFormFieldStrategy,
  ComplexFormFieldStrategy,
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
