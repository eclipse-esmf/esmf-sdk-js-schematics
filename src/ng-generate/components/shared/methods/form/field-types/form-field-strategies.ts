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
];
export const FORM_FIELD_DEFAULT_STRATEGY = DefaultFormFieldStrategy;

export type FormFieldStrategies = typeof FORM_FIELD_STRATEGIES;
export type FormFieldDefaultStrategy = typeof FORM_FIELD_DEFAULT_STRATEGY;
