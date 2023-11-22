## Table of Contents

-   [Generate a form component with the schematics command](#generate-a-form-component-with-the-schematics-command)
    -   [Flags and options that can be used in the generation process](#flags-and-options-that-can-be-used-in-the-generation-process)
        -   [Generate a component with a custom name](#generate-a-component-with-a-custom-name)
        -   [Select the element for which the form will be generated](#select-the-element-for-which-the-form-will-be-generated)
        -   [Exclude one or more properties from the generation](#exclude-one-or-more-properties-from-the-generation)
        -   [Exclude one or more constraints from the generation](#exclude-one-or-more-constraints-from-the-generation)
        -   [Multi-version support for Aspect Models](#multi-version-support-for-aspect-models)
        -   [Manual adaptions in _app.module.ts_](#manual-adaptions-in-appmodulets)
        -   [Show form as read only](#show-form-as-read-only)
    -   [Add translations](#add-translations)
    -   [Pre-load config file](#pre-load-config-file)
    -   [Skip Installation](#skip-install)
    -   [Overwrite](#overwrite)
    -   [Add material css theme](#add-material-css-theme)
    -   [Set View Encapsulation strategy](#set-View-Encapsulation-strategy)
    -   [Generate the environments files](#generate-the-environments-files)
-   [Output](#output)
    -   [Form structure](#form-structure)
    -   [Validation](#validation)
        -   [Base validators](#base-validators)
        -   [Constraint validators](#constraint-validators)
            -   [Supported Constraint types](#supported-constraint-types)
            -   [Unsupported Constraint types](#unsupported-constraint-types)
        -   [Type-specific validators](#type-specific-validators)
            -   [Supported complex data types](#supported-complex-data-types)
            -   [Unsupported complex data types](#unsupported-complex-data-types)
            -   [Supported scalar data types](#supported-scalar-data-types)
            -   [Unsupported scalar data types](#unsupported-scalar-data-types)
    -   [Usage](#usage)
    -   [Working with list-like controls](#working-with-list-like-controls)

# Generate a form component with the schematics command

```bash
schematics @esmf/semantic-ui-schematics:form
```

Generated files will be located under the folder structure as follows:

1. Multiple version support: `src/app/shared/components/<component-name>/<version>/`
2. Without multiple version support: `src/app/shared/components/<component-name>`
3. In the component's folder will be generated components for each form control from the form.

Files which are also automatically generated, but not included in the component's folder are:

1. `general.component.<style-extension>` under `src/assets/scss`

To be able to view correctly the material icons add the following
link: <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"> in the <head> section of
the index.html

# Flags and options that can be used in the generation process

---

## Generate a component with a custom name

By default, all the generated components will take the name of the aspect from the provided aspect model.

By running the command without the '--name flag'

```bash
ng generate @esmf/semantic-ui-schematics:form --dry-run=false
```

this will be the result in the generated component .ts file

```typescript
@Component({
    selector: 'esmf-sdk-ui-complex-list-types-form',
    templateUrl: './complex-list-types-form.component.html',
    styleUrls: ['./complex-list-types-form.component.scss'],
})
export class ComplexListTypesFormComponent
```

By running the command with the '--name' flag

```bash
ng generate @esmf/semantic-ui-schematics:form --dry-run=false --name=custom
```

the name of the component will be changed. This will be reflected under folder structure and as well for the component
selector.

```typescript
@Component({
    selector: 'esmf-sdk-ui-custom-form', // <- provided name reflected in the selector name
    templateUrl: './custom-form.component.html', // <- provided name reflected in the component path
    styleUrls: ['./custom-form.component.scss'], // <- provided name reflected in the component files
})
export class CustomFormComponent {} // <- provided name reflected in the component class name
```

---

## Select the element for which the form will be generated

The form can be generated for the whole Aspect Model, and in this case the first level of properties and entities will be considered or the form can
be generated for a specific entity.

```bash
Choose a specific Entity or Aspect to show as form: (Use arrow keys)
> urn:samm:org.eclipse.examples.movement:1.0.0#Movement (Aspect)
  urn:samm:org.eclipse.examples.movement:1.0.0#Entity (Entity)
```

The properties will be automatically read from the provided aspect model or entity, and you can select/deselect which of them
should be removed from the form.

---

## Exclude one or more properties from the generation

One or more properties of the selected Aspect Model Element or Entity can be excluded during the initial setup when
the following question appears:

```bash
Choose the properties to hide in the form: (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)
>( ) Property moving
 ( ) Property speedLimitWarning
```

The properties will be automatically read from the provided aspect model, and you can select/deselect which of them
should be removed from the form.

---

## Exclude one or more constraints from the generation

One or more constraints can be excluded during the initial setup when
the following question appears:

```bash
Choose the constraints to ignore in the form: (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)
>( ) urn:samm:org.eclipse.digitaltwin:1.0.0#LengthConstraintEitherRight
 ( ) urn:samm:org.eclipse.digitaltwin:1.0.0#RangeConstraintCollection
```

The constraints will be automatically read from the corresponding subtree of the selected element (Aspect Model Element or Entity),
and can be select/deselect in order to ignore/keep them in the generated form.

If a constraint relates to a subtree of previously excluded property, it will not be shown in the list during this step.

---

## Multi-version support for Aspect Models

By default, the support for different versions of the Aspect Models is
turned on. It can be disabled using the command line parameter `aspectModelVersionSupport`

```bash
ng generate @esmf/semantic-ui-schematics:form --dry-run=false --aspectModelVersionSupport=false
```

For this kind of multi-version support, the schematics for form UI component
generation creates files in the project's directory structure, as
depicted below:

In this example, the Aspect Model is named _Movement_, Version is 1.0.0.
You have the following directory structure after applying the
schematic for form UI component generation:

```text
    src
    +-- app
    |   +-- shared
    |       +-- components
    |           +-- movement-form
    |               +-- v100
    |                   +-- movement-form.component.scss
    |                   +-- movement-form.component.ts
    |                   +-- movement-form.component.html
    |                   +-- movement-form.module.ts
    |                   +-- movement-form.service.ts
    |                       +-- altitude
    |                           +-- altitude.component.html
    |                           +-- altitude.component.scss
    |                           +-- altitude.component.ts
    |                        +-- is-moving
    |                           +-- is-moving.component.html
    |                           +-- is-moving.component.scss
    |                           +-- is-moving.component.ts
    |
    +-- assets
        +-- i18n
            +-- shared
                +-- components
                    +-- movement-form
                        +-- v100
                            +-- en.movement-form.translation.json
```

Next time you use the schematic to create a form UI component from a different
version of the Aspect Model, you will get additional subdirectories for the
component and the language files.

---

## Manual adaptions in _app.module.ts_

Please note that you (eventually) need to manually adapt file
_src/app/app.module.ts_ in order to specify which versions of the form UI
component you would like to use. In the example below, versions 1.0.0 and
1.1.0 are to be used as components.

```typescript
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
    MovementFormModule as MovementFormModule_v100
} from './shared/components/movement-form/v100/movement-form.module';
import {
    MovementFormModule as MovementFormModule_v110
} from './shared/components/movement-form/v110/movement-form.module';

@NgModule({
    imports: [
        MovementFormModule_v100, // <-- Manually added
        MovementFormModule_v110  // <-- Manually added
    ]
})
```

This gives you the choice to decide which UI components (and in which version) are used to compose your web application.
You then can use this specific version of the form UI component, e.g. in _src/app/app.component.html_:

```angular2html

<esmf-sdk-ui-movement-form-v100></esmf-sdk-ui-movement-form-v100>
<esmf-sdk-ui-movement-form-v110></esmf-sdk-ui-movement-form-v110>
```

---

## Show form as read only

User can choose to have the form read only, by default it will be editable.

```bash
Do you want to set the form read only?
```

User may choose Yes or No.

---

## Add translations

In order to see the translations for the generated form we need to run:

```bash
schematics ../<folder of the scheamtics project>/src/collection.json:i18n --dry-run=false
ng generate @esmf/semantic-ui-schematics:i18n --dry-run=false
```

This command will install in demo project the following libraries: "@ngx-translate/core": "~15.0.0", "@ngx-translate/http-loader": "~8.0.0","ngx-i18n-combine": "~1.1.0"
And the translation file will be generated: en.movement-form.translation.json

## Pre-load config file

If you want to use a pre-existing config file, without going through the generation wizard, you may feed the path to the
.json config using the 'configFile' flag by running the command like this:

```bash
ng generate @esmf/semantic-ui-schematics:form --configFile=<config-file-name>-wizard.configs.json
```

Example of configuration file:

[//]: # 'TODO check this is up to date'

```json
{
    "aspectModelTFiles": ["Movement.ttl"],
    "excludedProperties": [],
    "configFile": "test-wizard.config.json",
    "complexProps": [],
    "configFileName": "test",
    "selectedModelElementUrn": "urn:samm:org.eclipse.examples.movement:1.0.0#Movement",
    "enableVersionSupport": true,
    "getOptionalMaterialTheme": false,
    "viewEncapsulation": "Emulated",
    "readOnlyForm": false,
    "overwrite": true
}
```

---

## Skip install

If you want to skip installation of dependencies you may use the '--skipInstall' flag

```bash
ng generate @esmf/semantic-ui-schematics:form --skipInstall
```

---

## Overwrite

If you want to overwrite the already existing generated files, you may use the '--overwrite' flag

```bash
ng generate @esmf/semantic-ui-schematics:form --overwrite
```

---

## Add material css theme

If you want to add the indigo pink material theme, you may use the '--getOptionalMaterialTheme' flag

when the wizard will prompt the question:

```bash
Do you want to add the Angular Material theme? (Indigo Pink Theme)
```

User may choose Yes or No.

if user did not set --getOptionalMaterialTheme to true but wants to add a material theme to the project,
in angular.json in styles section the following code can be added:

```bash
{
  "styles": [
    "src/styles.scss",
    "node_modules/@angular/material/prebuilt-themes/indigo-pink.css"
  ]
}

```

---

## Set View Encapsulation strategy

By default, the view encapsulation for the generated form component is set to None.
If you want to change the View Encapsulation strategy, you may use the '--viewEncapsulation' flag
where user can choose one of the following options: None, Emulated, ShadowDom.

when the wizard will prompt the question:

```bash
Do you want to specify view encapsulation strategy?
```

User may choose one of the values: None, Emulated, ShadowDom.

## Generate the environments files

```bash
ng generate environments
```

This command will generate the environments folder that will contain 2 files: environment.ts and environment.development.ts

---

# Output

As a result, a set of components with form fields and respective controls will be generated, as well as necessary utils and types.

---

## Form structure

Generated form structure may vary depending on the model: from a *Root Form Group* with a set of simple *Child Form Controls* to nested controls with `FormGroup`s and `FormArray`s.
Despite the possible variations, each form consists of a *Root Form Group* and *Child Form Controls*, which are generated as separate components and can be accessed/reused directly if needed.

Since the generated form is an Angular Reactive Form, all its methods are available for usage, according to the respective control type.

---

## Validation

Each form field or form group can have multiple validators depending on the subtree structure, taking into consideration element's data type, associated constraints, etc.

### Base validators

Each field/group can be marked as "required" depending on whether the corresponding element in the parsed model is considered as optional or not (has `"isOptional": true | false`).

### Constraint validators

During the generation process, validation rules from constraints will be extracted and applied to the corresponding form elements (individual fields or groups) if they were not explicitly excluded in one of the prompter questions.

When dealing with complex data types, the validation rules from constraints are applied to its children in most cases, however, there are exceptions.
For instance, [Length Constraint](https://eclipse-esmf.github.io/samm-specification/snapshot/characteristics.html#length-constraint) is applied directly to a group when working with Collection Characteristics (Collection, Set, Sorted Set, List).

Consult [ESMF documentation](https://eclipse-esmf.github.io/samm-specification/snapshot/characteristics.html#constraints) for more details on how different types of constraints work with different element types.

#### Supported Constraint types

* EncodingConstraint
* FixedPointConstraint
* LengthConstraint
* RangeConstraint (except dates)
* RegularExpressionConstraint

#### Unsupported Constraint types

* LanguageConstraint
* LocaleConstraint
* RangeConstraint (for dates)

### Type-specific validators

Since some fields can imply additional restrictions depending on the corresponding element type or its configuration, additional validators will be applied to the respective form control.
A typical example of such case could be "Either" characteristic, which expects values of its child controls to be specified and unique.

#### Supported complex data types

* Either
* StructuredValue

#### Unsupported complex data types

_None/Unknown_

#### Supported scalar data types

* xsd:string
* xsd:boolean
* xsd:decimal
* xsd:integer
* xsd:double
* xsd:float
* xsd:byte
* xsd:short
* xsd:int
* xsd:long
* xsd:unsignedByte
* xsd:unsignedShort
* xsd:unsignedInt
* xsd:unsignedLong
* xsd:positiveInteger
* xsd:nonNegativeInteger
* xsd:negativeInteger
* xsd:nonPositiveInteger
* xsd:gYear
* xsd:gMonth
* xsd:gDay
* xsd:gYearMonth
* xsd:gMonthDay
* xsd:duration
* xsd:yearMonthDuration
* xsd:dayTimeDuration
* xsd:time
* xsd:hexBinary
* xsd:base64Binary
* xsd:anyURI
* samm:curie
* rdf:langString

#### Unsupported scalar data types

* xsd:date
* xsd:dateTime
* xsd:dateTimeStamp

---

## Usage

For simple scenarios, the root component of the generated form provides the following outputs:
```typescript
@Output() formSubmit: EventEmitter<Movement> = new EventEmitter();
@Output() formCancel: EventEmitter<void> = new EventEmitter();
```
However, more complex scenarios, like patching form value, manually updating its validity, manipulating child controls, etc., may require a direct access to the *Root Form Group* or its *Child Form Controls*, that is why each control has been made public and can be imported and used directly.

An example with root "Movement" form:
```typescript
import {MovementForm} from "./shared/components/movement-form/v100/movement-form.component";
import {TrafficLight} from "./shared/types/movement/v100/movement.types";

// ...

export class AppComponent implements OnInit {
    ngOnInit() {
        MovementForm.disable();
        MovementForm.patchValue(<any>{
            isMoving: true,
            position: {
                latitude: 1,
                longitude: 2,
                altitude: 3
            },
            speed: 100,
            speedLimitWarning: TrafficLight.Yellow
        });
        MovementForm.get('isMoving')?.addValidators([Validators.required])
    }
}
```

---

## Working with list-like controls

For elements which are represented by a collection of elements, a table will be generated.
It is represented by a `FormArray` with child `FormControl`s, which contains the factual model, and the table itself acts as a visual representation of the model, or a view.

Since it's not possible to predict a number of `FormControl`s in the `FormArray`, as well as all the potential use-cases, controls of this type should be handled explicitly.
In order to provide a convenient way to communicate with the table and its respective form control, such components are accompanied by the following members:
- `[NAME]`FormControl - a form control of type `FormArray` (empty by default)
- `[NAME]`Events - a list of `Observable`s for each supported event

Usage example:
```typescript
import {listPropertyEvents, listPropertyFormControl} from "./shared/components/complex-list-types-form/v100/list-property/list-property.component";

// ...

export class AppComponent implements OnInit {
    ngOnInit() {
        listPropertyEvents.add$.subscribe(() => {
            listPropertyFormControl.push(new FormControl({
                CharacteristicX: 1,
                CharacteristicY: 2,
                CharacteristicZ: 3
            }))
        });

        listPropertyEvents.edit$.subscribe((selection) => {
            selection.forEach(item => {
                const control = listPropertyFormControl.at(item.controlIndex);
                const newValue = {
                    CharacteristicX: 1,
                    CharacteristicY: 2,
                    CharacteristicZ: 3
                }
                control.patchValue(newValue);
            });
        });
        listPropertyEvents.delete$.subscribe((selection) => {
            selection.forEach(item => listPropertyFormControl.removeAt(item.controlIndex));
        });
    }
}
```