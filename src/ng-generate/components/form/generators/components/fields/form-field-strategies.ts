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

export const FORM_FIELD_STRATEGIES = [
    ComplexFormFieldStrategy,
    EitherFormFieldStrategy,
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
