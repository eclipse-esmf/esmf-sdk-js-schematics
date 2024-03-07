# ESMF SKD JS :: Angular Schematics 👷

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
        -   [Howto generate a table component with the schematics command](#howto-generate-a-table-component-with-the-schematics-command)
    -   [The _card_ schematics](#the-card-schematics)
        -   [Features provided by the schematics card](#features-provided-by-the-schematics-card)
        -   [Howto generate a card component with the schematics command](#howto-generate-a-card-component-with-the-schematics-command)
    -   [The _form_ schematics](#the-form-schematics)
        -   [Features provided by the schematics form](#features-provided-by-the-schematics-form)
        -   [Howto generate a form component with the schematics command](#howto-generate-a-form-component-with-the-schematics-command)
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
-   default configurations can be set in config file even if they are not asked in the prompter

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
   Run `npm install -g @angular/cli@17`

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
npm install -g @angular-devkit/schematics-cli@17
```

4. Optionally add some .ttl files in the same folder in order to use in the schema generation process. The schematic
   generator will ask for a path to one or more .ttl files

5. Install and run the command to generate the component, table in this case (do not use Git Bash, preferably use idea
   terminal, (Windows) command promt or other (Linux/Mac) terminal)

**_NOTE:_** Please enter the desired version under {Version}.

```bash
npm install --save-dev https://github.com/eclipse-esmf/esmf-sdk-js-schematics/releases/download/v{Version}/esmf-semantic-ui-schematics-{Version}.tgz
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
-   card
-   form
-   i18n
-   types

6. add translations

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

7. add environment files

```bash
ng generate environments
```

8. add default translation language to root component.

```typescript
constructor(private translate: TranslocoService)
{
    translate.use(translate.defaultLang);
}
```

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
    isMoving: boolean;
    speed: number;
    speedLimitWarning: TrafficLight;
    position: SpatialPosition;
}

export enum TrafficLight {
    Green = 'green',
    Yellow = 'yellow',
    Red = 'red',
}

export interface SpatialPosition {
    latitude: number;
    longitude: number;
    altitude?: number;
}
```

---

## The _table_ schematics

The table schematics can be used for table generation. This is achieved by using the table provided in
the [angular material package](https://v17.material.angular.io/components/table/overview).

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

### Howto generate a table component with the schematics command

[Link to readme](src/ng-generate/components/table/README.md)

---

## The _card_ schematics

The card schematics can be used for card generation. This is achieved by using the card provided in
the [angular material package](https://v17.material.angular.io/components/card/overview).

### Features provided by the schematics card

1. Types generation
2. Aspect model multiple version support
3. Command bar
    1. Search filter for string properties
    2. Dropdown filter for enum properties
    3. Date-time filter for date-time properties
    4. Export functionality
    5. Refresh data functionality
    6. Custom actions
4. Event emitters exposed for click, double click, right click treated as context menu events
5. Card generation for the entire aspect or just a property of user's choice
6. Multiple aspect models selection
7. Default card sorting actions
8. Select if translations should be generated for removed properties.
9. Wizard output to regenerate the same card without going through the wizard again
10. JSON access path
11. Custom actions for a card
12. Pagination
13. Client or remote data handling
14. Custom card content to create your own preferences
15. Possibility to add a custom service which can or cannot be overridden when generating the same component again

### Howto generate a card component with the schematics command

[Link to readme](src/ng-generate/components/card/README.md)

---

## The _form_ schematics

The form schematics can be used for form generation.

### Features provided by the schematics form

1. Types generation
2. Aspect model multiple version support
3. Form generation for the entire aspect or just an entity of user's choice
4. Multiple aspect models selection
5. Wizard output to regenerate the same form without going through the wizard again
6. Possibility to set the form as read only
7. Validation rules for form fields and groups (partial support)

### How to generate a form component with the schematics command

[Link to readme](src/ng-generate/components/form/README.md)

---

## Documentation

Further documentation and howto's are provided in the
official [JS SDK User Documentation](https://eclipse-esmf.github.io/js-sdk-guide/index.html)

## License

SPDX-License-Identifier: MPL-2.0

This program and the accompanying materials are made available under the terms of the
[Mozilla Public License, v. 2.0](LICENSE).

The [Notice file](NOTICE.md) details contained third party materials.
