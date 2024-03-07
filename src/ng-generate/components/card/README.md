## Table of Contents

-   [Generate a card component with the schematics command](#generate-a-card-component-with-the-schematics-command)
    -   [Flags and options that can be used in the generation process](#flags-and-options-that-can-be-used-in-the-generation-process)
        -   [Generate a component with a custom name](#generate-a-component-with-a-custom-name)
        -   [Exclude one or more properties from the generation](#exclude-one-or-more-properties-from-the-generation)
        -   [Multi-version support for Aspect Models](#multi-version-support-for-aspect-models)
        -   [Manual adaptions in _app.module.ts_](#manual-adaptions-in-appmodulets)
        -   [Show customized information in the card with ng-template](#show-customized-information-in-the-card-with-ng-template)
        -   [Export functionality](#export-functionality)
    -   [Custom icons for the command bar](#custom-icons-for-the-command-bar)
    -   [Add translations](#add-translations)
    -   [Pre-load config file](#pre-load-config-file)
    -   [Skip Installation](#skip-install)
    -   [Overwrite](#overwrite)
    -   [Add material css theme](#Add-material-css-theme)
    -   [Set View Encapsulation strategy](#Set-View-Encapsulation-strategy)

# Generate a card component with the schematics command

```bash
schematics @esmf/semantic-ui-schematics:card
```

Generated files will be located under the folder structure as follows:

1. Multiple version support: `src/app/shared/components/<component-name>/<version>/`
2. Without multiple version support: `src/app/shared/components/<component-name>`

Files which are also automatically generated, but not included in the component's folder are:

1. `export-card.dialot.component.ts` under `src/app/shared/export-confirmation-dialog`
2. `general.component.<style-extension>` under `src/assets/scss`

To be able to view correctly the material icons add the following
link: <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"> in the <head> section of
the index.html

# Flags and options that can be used in the generation process

---

## Generate a component with a custom name

By default, all the generated components will take the name of the aspect from the provided aspect model.

By running the command without the '--name flag'

```bash
ng generate @esmf/semantic-ui-schematics:card --dry-run=false
```

this will be the result in the generated component .ts file

```typescript
@Component({
    selector: 'esmf-sdk-ui-movement-card',
    templateUrl: './movement-card.component.html',
    styleUrls: ['./movement-card.component.scss'],
})
export class MovementCardComponent {}
```

By running the command with the '--name' flag

```bash
ng generate @esmf/semantic-ui-schematics:card --dry-run=false --name=custom
```

the name of the component will be changed. This will be reflected under folder structure and as well for the component
selector.

```typescript
@Component({
    selector: 'esmf-sdk-ui-custom-card', // <- provided name reflected in the selector name
    templateUrl: './custom-card.component.html', // <- provided name reflected in the component path
    styleUrls: ['./custom-card.component.scss'], // <- provided name reflected in the component files
})
export class CustomCardComponent {} // <- provided name reflected in the component class name
```

---

## Exclude one or more properties from the generation

One or more properties of an Aspect Model Element e.g. generating a card can be excluded during the initial setup when
the following question appears:

```bash
Choose the properties to hide in the card: (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)
>( ) Property moving
 ( ) Property speedLimitWarning
```

The properties will be automatically read from the provided aspect model, and you can select/deselect which of them
should be removed from the card columns.

---

## Multi-version support for Aspect Models

Per default, the support for different versions of the Aspect Models is
turned on. It can be disabled using the command line parameter `aspectModelVersionSupport`

```bash
ng generate @esmf/semantic-ui-schematics:card --dry-run=false --aspectModelVersionSupport=false
```

For this kind of multi-version support, the schematics for card UI component
generation creates files in the project's directory structure, as
depicted below:

In this example, the Aspect Model is named _Movement_, Version is 1.0.0.
You have the following directory structure after applying the
schematic for card UI component generation:

```text
    src
    +-- app
    |   +-- shared
    |       +-- components
    |           +-- movement-card
    |               +-- v100
    |                   +-- movement-card.component.scss
    |                   +-- movement-card.component.ts
    |                   +-- movement-card.component.html
    |                   +-- movement-card-command-bar.component.ts
    |                   +-- movement-card-command-bar.component.html
    |                   +-- movement-card-chip-list.component.ts
    |                   +-- movement-card-chip-list.component.scss
    |                   +-- movement-card-chip-list.component.html
    |                   +-- movement-card.module.ts
    |                   +-- movement-card.service.ts
    |                   +-- movement-card-filter.service.ts
    |
    +-- assets
        +-- i18n
            +-- shared
                +-- components
                    +-- movement-card
                        +-- v100
                            +-- en.movement-card.translation.json
```

Next time you use the schematic to create a card UI component from a different
version of the Aspect Model, you will get additional subdirectories for the
component and the language files.

---

## Manual adaptions in _app.module.ts_

Please note that you (eventually) need to manually adapt file
_src/app/app.module.ts_ in order to specify which versions of the card UI
component you would like to use. In the example below, versions 1.0.0 and
1.1.0 are to be used as components.

```typescript
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
    MovementCardModule as MovementCardModule_v100
} from './shared/components/movement-card/v100/movement-card.module';
import {
    MovementCardModule as MovementCardModule_v110
} from './shared/components/movement-card/v110/movement-card.module';

@NgModule({
    imports: [
        MovementCardModule_v100, // <-- Manually added
        MovementTCardModule_v110  // <-- Manually added
    ]
})
```

This gives you the choice to decide which UI components (and in which version) are used to compose your web application.
You then can use this specific version of the card UI component, e.g. in _src/app/app.component.html_:

```angular2html

<esmf-sdk-ui-movement-card-v100></esmf-sdk-ui-movement-card-v100>
<esmf-sdk-ui-movement-card-v110></esmf-sdk-ui-movement-card-v110>
```

---

## Show customized information in the card with ng-template

In your parent HTML file, you have the ability to define a custom ng-template. 
This template will be integrated directly into the card's content. 

You can either:

* Utilize the pre-defined elements and their values, or
* Introduce entirely custom content according to your requirements.

This flexibility allows you to tailor the card's appearance and behavior to fit specific scenarios.

**_NOTE:_** The "let-element" should be constructed from the component's name, following the pattern <componentName>CardValues. 
This naming convention can also be directly observed within the child component (refer to the Enum).

Without versioning:
```html
<esmf-sdk-ui-movement-card-v100>
    <ng-template #cardTemplate let-data let-element="<componentName>CardValues" let-getElementValue="getElementValue" let-translateService="translateService">
        <div class="data-card-element" *ngFor="let elem of element">
            <b>{{ elem + ".preferredName" | transloco }}</b>: {{ getElementValue(data, elem) }}
        </div>
    </ng-template>
</esmf-sdk-ui-movement-card-v100>
```

With versioning:
```html
<esmf-sdk-ui-movement-card-v100>
    <ng-template #cardTemplate let-data let-element="<componentName>CardValues" let-getElementValue="getElementValue" let-translateService="translateService">
        <div class="data-card-element" *ngFor="let elem of element">
            <b>{{ 'movement.v210.' + elem + ".preferredName" | transloco }}</b>: {{ getElementValue(data, elem) }}
        </div>
    </ng-template>
</esmf-sdk-ui-movement-card-v100>
```
---

## Add translations

In order to see the translations for the generated card we need to run:

```bash
schematics ../<folder of the scheamtics project>/src/collection.json:i18n --dry-run=false
ng generate @esmf/semantic-ui-schematics:i18n --dry-run=false
```

This command will install in demo project the following libraries: "@ngneat/transloco": "^6.x", "ngx-i18n-combine": "^1.x"
And the translation file will be generated: en.movement-form.translation.json

## Export functionality

After generating a card which contains a command bar, the export data button will be present in the right corner of the
toolbar.

By pressing it, a modal dialog window will appear with multiple options.

1. If the data is handled on the client side, the following options will appear:

    1. Export all pages (by default)
       Pressing this button will result into a full data export to a csv file.
    2. Export only first page
       If this option appears, this will lead to a csv file being exported including only the first page from the view.

2. If the data is handled remotely, the following options will be visible:

    1. Export all pages (by default) - option which exports a csv containing the set of data which can be visible on that
       page.
    2. Export only first page
       If this option appears, this will lead to a csv file being exported including only the first page from the view.
    3. Export all pages (only if an ExtendedCsvExporter function is passed to the card through bindings) - will result
       in exporting the data by calling an external function passed to the generated component through binding by using
       the `extendedCsvExporter` attribute.

    ```html
    <esmf-sdk-ui-movement-card-v321 [extendedCsvExporter]="csvExporter"></esmf-sdk-ui-movement-card-v321>
    ```

   The `csvExporter` function will have a type `ExtendedCsvExporter` exported in the component's service file, and it
   will need to implement a function with 2 arguments, the displayed columns and the RQL query which will query the data
   from the backend.

    ```typescript
    export interface ExtendedCsvExporter {
        export(displayedColumns: string[], rqlQuery: string): void;
    }
    ```

   If this function is not exposed to the component, this option will not appear in the export dialog window.

### Custom icons for the command bar

When running the command

```bash
ng generate @esmf/semantic-ui-schematics:card --dry-run=false
```

the wizard will prompt at some point along the generation process this question:

```bash
To add custom action buttons on the command bar, enter the names of SVG-files or style classes. SVG files will be looked for in ./assets/icons directory. Use ',' to enter multiple (e.g. edit.svg, schedule): (Use tab for suggestions)
```

As prompted in the helper text, you have two options:

1. Pass in an icon name (including the extension - .svg) which needs to exist in the folder under the path _*
   ./assets/icons*_
2. Pass in a material icon name which exists in
   the [material icons library](https://fonts.google.com/icons?selected=Material+Icons).

---

## Pre-load config file

If you want to use a pre-existing config file, without going through the generation wizard, you may feed the path to the
.json config using the 'configFile' flag by running the command like this:

```bash
ng generate @esmf/semantic-ui-schematics:card --configFile=<config-file-name>-wizard.configs.json
```

Example of configuration file:

[//]: # (TODO check this is up to date)

```json
{
    "aspectModelTFiles": ["FOLDER\\Movement.ttl"],
    "excludedProperties": [],
    "configFile": "wizard.config.json",
    "complexProps": [
        {
            "prop": "position",
            "propsToShow": ["x", "y", "z"]
        }
    ],
    "selectedModelElementUrn": "urn:samm:org.eclipse.esmf.test:1.0.0#Movement",
    "jsonAccessPath": "",
    "defaultSortingCol": "moving",
    "customRowActions": ["schedule"],
    "addCommandBar": true,
    "enabledCommandBarFunctions": ["addCustomCommandBarActions", "addSearchBar", "addEnumQuickFilters"],
    "customCommandBarActions": ["edit.svg"],
    "enableRemoteDataHandling": true,
    "enableVersionSupport": true,
    "overwrite": true,
    "getOptionalMaterialTheme": false
}
```

---

## Skip install

If you want to skip installation of dependencies you may use the '--skipInstall' flag

```bash
ng generate @esmf/semantic-ui-schematics:card --skipInstall
```

---

## Overwrite

If you want to overwrite the already existing generated files, you may use the '--overwrite' flag

```bash
ng generate @esmf/semantic-ui-schematics:card --overwrite
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

By default, the view encapsulation for the generated card component is set to None.
If you want to change the View Encapsulation strategy, you may use the '--viewEncapsulation' flag
where user can choose one of the following options: None, Emulated, ShadowDom.

when the wizard will prompt the question:

```bash
Do you want to specify view encapsulation strategy?
```

User may choose one of the values: None, Emulated, ShadowDom.
