# ESMF SKD JS :: Angular Schematic 👷

## Table of Contents

-   [Introduction](#introduction)
-   [Getting help](#getting-help)
-   [Features](#features)
-   [Getting started](#getting-started)
    -   [Prerequisites](#prerequisites)
    -   [Using the schematic commands in external projects for testing purpose](#using-the-schematic-commands-in-external-projects-for-testing-purpose)
-   [Overview of the schematics commands](#overview-of-the-schematics-commands)
    -   [The _types_ schematics](#the-types-schematics)
        -   [Usage](#usage)
        -   [Example type definition file](#example-type-definition-file)
    -   [The _table_ schematics](#the-table-schematics)
        -   [Features provided by the schematics table](#features-provided-by-the-schematics-table)
    -   [Generate a component with the schematics command](#generate-a-component-with-the-schematics-command)
    -   [Flags and options that can be used in the generation process](#flags-and-options-that-can-be-used-in-the-generation-process)
        -   [Generate a component with a custom name](#generate-a-component-with-a-custom-name)
        -   [Exclude one or more properties from the generation](#exclude-one-or-more-properties-from-the-generation)
        -   [Multi-version support for Aspect Models](#multi-version-support-for-aspect-models)
        -   [Manual adaptions in _app.module.ts_](#manual-adaptions-in-appmodulets)
        -   [Show customized information in the table](#show-customized-information-in-the-table)
        -   [Export functionality](#export-functionality)
    -   [Custom icons for the command bar](#custom-icons-for-the-command-bar)
    -   [Add translations](#add-translations)
    -   [Pre-load config file](#pre-load-config-file)
    -   [Skip Installation](#skip-install)
    -   [Overwrite](#overwrite)
-   [Documentation](#documentation)
-   [License](#license)

## Introduction

This repository contains a bundle of Angular schematics that may be used to
create [Angular components](https://angular.io/guide/component-overview) and generate code based
on [RDF aspect module object](https://www.w3.org/TR/turtle/).

## Getting help

Are you having trouble with SDK JS? We want to help!

-   Check the [developer documentation](https://eclipse-esmf.github.io)
-   Having issues with the ESMF SDK JS schematics? Open
    a [GitHub issue](https://github.com/eclipse-esmf/esmf-sdk-js-schematics/issues).

## Features

The schematics' collection for this package includes dynamic generation of:

-   internationalization, using [i18n](https://angular.io/guide/i18n).
-   custom table components based on any aspect model loaded.
-   proper types of properties and entities used.

## SDK schematics uses ESMF Aspect Model Loader library

-   This library is also an open source project and can be found
    at: https://github.com/eclipse-esmf/esmf-sdk-js-aspect-model-loader (no action required, this library is already
    included in SDK schematics)

## SDK schematics generates components based on ttl files

TTl files can be generated using the open source project: Aspect Model Editor (https://github.com/eclipse-esmf/esmf-sdk)
Aspect Model Editor project uses ESMF Samm Aspect Meta
model (https://github.com/eclipse-esmf/esmf-semantic-aspect-meta-model)

## Getting started

### Prerequisites

In order to generate code based on the available schematics, the following steps must be taken:

1. Install [node](https://nodejs.org/en/) (LTS version).

2. Schematics are part of the Angular ecosystem so angular-cli must be installed by running this command in a terminal:
   `npm install -g @angular/cli@14`

3. Run `npm install -g @angular-devkit/schematics-cli@14` in a terminal.

For more info on schematics, use the following command:

```bash
ng generate @esmf/semantic-ui-schematics:<schematics-name> --help
```

## Using the schematic commands in external projects for testing purpose

The `semantics-ui-schematics` is a plain typescript project that is used to execute schematics, based on user decision.

1. create a new folder, preferably outside of `semantic-ui-schematics` folder
2. create a new project using (custom project name may be used):

```bash
ng new demo-schematic

cd demo-schematic
```

3. run (if not already installed):

```bash
npm install -g @angular-devkit/schematics-cli@14
```

4. Optionally add some .ttl files in the same folder in order to use in the schema generation process. The schematic
   generator will ask for a path to one or more .ttl files

5. Optionally modify tsconfig.json by adding to the `compilerOptions` field the following (prevents compiler warnings):

```json
{
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
}
```

6. Install and run the command to generate the component, table in this case (do not use Git Bash, preferably use idea
   terminal, (Windows) command promt or other (Linux/Mac) terminal)

```bash
npm install --save-dev https://github.com/eclipse-esmf/esmf-sdk-js-schematics/releases/download/v2.1.0/esmf-semantic-ui-schematics-2.1.0.tgz
ng generate @esmf/semantic-ui-schematics:table
```

or if you have sdk schematics project installed locally run:

```bash
ng generate ..\<folder of the scheamtics project>\src\collection.json:table --dry-run=false
```

then pass the .ttl file/s paths from step `4` when prompted.

> A new component should be generated under : `app/shared/components/<component-name>` with resolved
> dependencies.

For a list of available schematics and details use:

```bash
schematics @esmf/semantic-ui-schematics:<schematics-name> --help
```

where `<schematics-name>` can be replaced by:

-   table
-   i18n
-   types

7. add translations

```bash
ng generate @esmf/semantic-ui-schematics:i18n
```

or if you have sdk schematics project installed locally run:

```bash
ng generate ..\<folder of the scheamtics project>\src\collection.json:i18n --dry-run=false
```

> A new command should be added in package.json inside scripts section:
> "combine-i18n"

Run combine-i18n command:

```bash
npm run combine-i18n
```

And in assets folder an i18n folder should be generated. And i18n folder should contain the translations json files:
en.movement-table.translation.json, en.json.

## Overview of the schematics commands

### The _types_ schematics

This angular schematic can be used to generate TypeScript type definitions
from a concrete aspect model.
These TypeScript type definitions assist developers in writing type-safe code
when writing Angular web applications dealing with aspect models.

Although this part is included in the table generation, it can also be used stand alone.

#### Usage

```bash
ng generate @esmf/semantic-ui-schematics:types
```

This command will interactively ask for a comma separated list of aspect model
files in Turtle (Terse RDF Triple Language) format.

The TypeScript type definition files will be created in folder _app/shared/types_.

> **_NOTE:_** The types schematics is automatically run inside the table generation process. This can be also run
> manually.

---

#### Example type definition file

Aspect model: _movement.ttl_

File _app/shared/types/movement.types.ts_

```typescript
export interface Movement {
    moving: boolean;
    speedLimitWarning: WarningLevel;
    position: SpatialPosition;
}

export enum WarningLevel {
    Green = 'green',
    Yellow = 'yellow',
    Red = 'red',
}

export interface SpatialPosition {
    x: number;
    y: number;
    z: number;
}
```

---

## The _table_ schematics

The table schematics can be used for table generation. This is achieved by using the table provided in
the [angular material package](https://v12.material.angular.io/components/table/overview).

### Features provided by the schematics table

1. Types generation
2. Aspect model multiple version support
3. Command bar
    1. Search filter for string properties
    2. Dropdown filter for enum properties
    3. Date-time filter for date-time properties
    4. Export functionality
    5. Refresh data functionality
    6. Custom actions
4. Single or multiple selection with checkboxes
5. Event emitters exposed for click, double click, right click treated as context menu events
6. Table generation for the entire aspect or just a property of user's choice
7. Multiple aspect models selection
8. Column ordering
9. Default sorting column selection
10. Removing properties from tables header
11. Select if translations should be generated for removed properties.
12. Column pop-up selection for showing/hiding the columns header after table generation
13. Wizard output to regenerate the same table without going through the wizard again
14. JSON access path
15. Custom actions for a row in the table
16. Pagination
17. Client or remote data handling
18. Possibility to add a custom service which can or cannot be overridden when generating the same component again

## Generate a component with the schematics command

```bash
schematics @esmf/semantic-ui-schematics:table
```

Generated files will be located under the folder structure as follows:

1. Multiple version support: `src/app/shared/components/<component-name>/<version>/`
2. Without multiple version support: `src/app/shared/components/<component-name>`

Files which are also automatically generated, but not included in the component's folder are:

1. `resize-column.directive.ts` under `src/app/shared/directives`
2. `storage.service.ts` under `src/app/shared/services`
3. `table.component.<style-extension>` under `src/assets/scss`

To be able to view corectly the material icons add the following
link: <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"> in the <head> section of
the index.html

## Flags and options that can be used in the generation process

---

### Generate a component with a custom name

By default, all the generated components will take the name of the aspect from the provided aspect model.

By running the command without the '--name flag'

```bash
ng generate @esmf/semantic-ui-schematics:table --dry-run=false --name=custom
```

this will be the result in the generated component .ts file

```typescript
@Component({
    selector: 'esmf-sdk-ui-movement-table',
    templateUrl: './movement-table.component.html',
    styleUrls: ['./movement-table.component.scss'],
})
export class MovementTableComponent {}
```

By running the command with the '--name' flag

```bash
ng generate @esmf/semantic-ui-schematics:table --dry-run=false --name=custom
```

the name of the component will be changed. This will be reflected under folder structure and as well for the component
selector.

```typescript
@Component({
    selector: 'esmf-sdk-ui-custom-table', // <- provided name reflected in the selector name
    templateUrl: './custom-table.component.html', // <- provided name reflected in the component path
    styleUrls: ['./custom-table.component.scss'], // <- provided name reflected in the component files
})
export class CustomTableComponent {} // <- provided name reflected in the component class name
```

---

### Exclude one or more properties from the generation

One or more properties of an Aspect Model Element e.g. generating a table can be excluded during the initial setup when
the following question appears:

```bash
Choose the properties to hide in the table: (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)
>( ) Property moving
 ( ) Property speedLimitWarning
```

The properties will be automatically read from the provided aspect model, and you can select/deselect which of them
should be removed from the table columns.

---

### Multi-version support for Aspect Models

Per default, the support for different versions of the Aspect Models is
turned on. It can be disabled using the command line parameter `aspectModelVersionSupport`

```bash
ng generate @esmf/semantic-ui-schematics:table --dry-run=false --aspectModelVersionSupport=false
```

For this kind of multi-version support, the schematics for table UI component
generation creates files in the project's directory structure, as
depicted below:

In this example, the Aspect Model is named _Movement_, Version is 1.0.0.
You have the following directory structure after applying the
schematic for table UI component generation:

```text
    src
    +-- app
    |   +-- shared
    |       +-- components
    |           +-- movement-table
    |               +-- v100
    |                   +-- movement-table-datasource.ts
    |                   +-- movement-table.component.css
    |                   +-- movement-table.component.html
    |                   +-- movement-table.module.ts
    |                   +-- movement-table.component.ts
    |                   +-- material-table-column-menu.component.ts
    |                   +-- movement-table.service.ts
    |
    +-- assets
        +-- i18n
            +-- shared
                +-- components
                    +-- movement-table
                        +-- v100
                            +-- en.movement-table.translation.json
```

Next time you use the schematic to create a table UI component from a different
version of the Aspect Model, you will get additional subdirectories for the
component and the language files.

---

### Manual adaptions in _app.module.ts_

Please note that you (eventually) need to manually adapt file
_src/app/app.module.ts_ in order to specify which versions of the table UI
component you would like to use. In the example below, versions 1.0.0 and
1.1.0 are to be used as components.

```typescript
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
    MovementTableModule as MovementTableModule_v100
} from './shared/components/movement-table/v100/movement-table.module';
import {
    MovementTableModule as MovementTableModule_v110
} from './shared/components/movement-table/v110/movement-table.module';

@NgModule({
    imports: [
        MovementTableModule_v100, // <-- Manually added
        MovementTableModule_v110  // <-- Manually added
    ]
})
```

This gives you the choice to decide which UI components (and in which version) are used to compose your web application.
You then can use this specific version of the table UI component, e.g. in _src/app/app.component.html_:

```angular2html

<esmf-sdk-ui-movement-table-v100></esmf-sdk-ui-movement-table-v100>
<esmf-sdk-ui-movement-table-v110></esmf-sdk-ui-movement-table-v110>
```

---

### Show customized information in the table

Running the following command in combination with 'customColumn : chart,slider' answered in the prompter, creates a
table column or more, depending on the number of elements that where inserted (separated by comma), where an Angular
template with the same ID will be rendered:

```bash
ng generate @esmf/semantic-ui-schematics:table --dry-run=false
```

The following template will be injected:

```angular2html

<esmf-sdk-ui-movement-table-v100 [chartColumn]="chart" [sliderColumn]="slider"></esmf-sdk-ui-movement-table-v100>

<ng-template #chart let-aspect="aspect">
    <!-- custom content goes here...-->
</ng-template>

<ng-template #slider let-aspect="aspect">
    <!-- custom content goes here...-->
</ng-template>
```

---

### Add translations

In order to see the translations for the generated table we need to run:

```bash
schematics ../<folder of the scheamtics project>/src/collection.json:i18n --dry-run=false
ng generate @esmf/semantic-ui-schematics:i18n --dry-run=false
```

This command will install in demo project :

### Export functionality

After generating a table which contains a command bar, the export data button will be present in the right corner of the
toolbar.

By pressing it, a modal dialog window will appear with multiple options.

1. If the data is handled on the client side, the following options will appear:

    1. Export all pages (by default)
       Pressing this button will result into a full data export to a csv file.
    2. Export selected rows (only if there are any rows selected)
       If this option appears, this will lead to a csv file being exported including only the selected rows from the
       table. If the table included checkboxes with the header checkbox selected (option for selecting all rows present
       in the table) will lead to a csv exported including only the page that you are currently seing on screen and not
       all the data in the table. This can be used to download a paginated set of data.

2. If the data is handled remotely, the following options will be visible:

    1. Export all rows (by default) - option which exports a csv containing the set of data which can be visible on that
       page.
    2. Export selected rows (only if there are any rows selected) - will result in exporting a csv containing only the
       selected rows.
    3. Export all pages (only if an ExtendedCsvExporter function is passed to the table through bindings) - will result
       in exporting the data by calling an external function passed to the generated component through binding by using
       the `extendedCsvExporter` attribute.

    ```html
    <esmf-sdk-ui-movement-table-v321 [extendedCsvExporter]="csvExporter"></esmf-sdk-ui-movement-table-v321>
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

#### Custom icons for the command bar

When running the command

```bash
ng generate @esmf/semantic-ui-schematics:table --dry-run=false
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

### Custom icons for each row

As mentioned above, when running the command

```bash
ng generate @esmf/semantic-ui-schematics:table --dry-run=false
```

the wizard will prompt the question:

```bash
To add custom action buttons for each table row, enter the names of SVG-files or style classes. SVG files will be looked for in ./assets/icons directory. Use ',' to enter multiple (e.g. edit.svg,schedule):
```

Here the same two options as in the command bar custom actions case, you can:

1. Pass in an icon name (including the extension - .svg) which needs to exist in the folder under the path _*
   ./assets/icons*_
2. Pass in a material icon name which exists in
   the [material icons library](https://fonts.google.com/icons?selected=Material+Icons).

---

### Pre-load config file

If you want to use a pre-existing config file, without going through the generation wizard, you may feed the path to the
.json config using the 'configFile' flag by running the command like this:

```bash
ng generate @esmf/semantic-ui-schematics:table --configFile=wizard-configs/<config-file-name>.json
```

Example of configuration file:

```json
{
    "aspectModelTFiles": ["FOLDER\\Movement.ttl"],
    "excludedProperties": [],
    "configFile": "wizard-config.json",
    "complexProps": [
        {
            "prop": "position",
            "propsToShow": ["x", "y", "z"]
        }
    ],
    "selectedModelElementUrn": "urn:samm:org.eclipse.esmf.test:1.0.0#Movement",
    "jsonAccessPath": "",
    "defaultSortingCol": "moving",
    "customColumns": [],
    "addRowCheckboxes": false,
    "customRowActions": ["schedule"],
    "addCommandBar": true,
    "enabledCommandBarFunctions": ["addCustomCommandBarActions", "addSearchBar", "addEnumQuickFilters"],
    "customCommandBarActions": ["edit.svg"],
    "enableRemoteDataHandling": true,
    "enableVersionSupport": true,
    "overwrite": true
}
```

---

### Skip install

If you want to skip installation of dependencies you may use the '--skipInstall' flag

```bash
ng generate @esmf/semantic-ui-schematics:table --skipInstall
```

---

### Overwrite

If you want to overwrite the already existing generated files, you may use the '--overwrite' flag

```bash
ng generate @esmf/semantic-ui-schematics:table --overwrite
```

---

## Documentation

Further documentation and howto's are provided in the
official [JS SDK User Documentation](https://eclipse-esmf.github.io/js-sdk-guide/index.html)

## License

SPDX-License-Identifier: MPL-2.0

This program and the accompanying materials are made available under the terms of the
[Mozilla Public License, v. 2.0](LICENSE).

The [Notice file](NOTICE.md) details contained third party materials.
