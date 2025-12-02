## Table of Contents

- [Generate a table component with the schematics command](#generate-a-table-component-with-the-schematics-command)
  - [Flags and options that can be used in the generation process](#flags-and-options-that-can-be-used-in-the-generation-process)
    - [Generate a component with a custom name](#generate-a-component-with-a-custom-name)
    - [Exclude one or more properties from the generation](#exclude-one-or-more-properties-from-the-generation)
    - [Multi-version support for Aspect Models](#multi-version-support-for-aspect-models)
    - [Show customized information in the table](#show-customized-information-in-the-table)
    - [Export functionality](#export-functionality)
  - [Custom icons for the command bar](#custom-icons-for-the-command-bar)
  - [Add translations](#add-translations)
  - [Pre-load config file](#pre-load-config-file)
  - [Skip Installation](#skip-install)
  - [Overwrite](#overwrite)
  - [Add material css theme](#Add-material-css-theme)
  - [Set View Encapsulation strategy](#Set-View-Encapsulation-strategy)

# Generate a table component with the schematics command

```bash
schematics @esmf/semantic-ui-schematics:table
```

Generated files will be located under the folder structure as follows:

1. Multiple version support: `src/app/shared/components/<component-name>/<version>/`
2. Without multiple version support: `src/app/shared/components/<component-name>`

Files which are also automatically generated, but not included in the component's folder are:

1. `resize-column.directive.ts` under `src/app/shared/directives`
2. `highlight.directive.ts` under `src/app/shared/directives`
3. `horizontal-overflow.ts` under `src/app/shared/directives`
4. `validate-input.ts` under `src/app/shared/directives`
5. `local-storage.service.ts` under `src/app/shared/services`
6. `show-descripiton.ts` under `src/app/shared/pipes`
7. `general.component.<style-extension>` under `src/assets/scss`
8. `export-table.dialot.component.ts` under `src/app/shared/export-confirmation-dialog`

To be able to view correctly the material icons add the following
link: <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"> in the <head> section of
the index.html

# Flags and options that can be used in the generation process

---

## Generate a component with a custom name

By default, all the generated components will take the name of the aspect from the provided aspect model.

By running the command without the '--name flag'

```bash
ng generate @esmf/semantic-ui-schematics:table --dry-run=false --name=movement-table
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
ng generate @esmf/semantic-ui-schematics:card --dry-run=false --name=custom
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

## Exclude one or more properties from the generation

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

## Multi-version support for Aspect Models

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
    |                   +-- movement-table.component.ts
    |                   +-- movement-table.component.scss
    |                   +-- movement-table.component.html
    |                   +-- movement-table-command-bar.component.ts
    |                   +-- movement-table-command-bar.component.html
    |                   +-- movement-table-chip-list.component.ts
    |                   +-- movement-table-chip-list.component.scss
    |                   +-- movement-table-chip-list.component.html
    |                   +-- movement-table-config-menu.component.ts
    |                   +-- movement-table-config-menu.component.html
    |                   +-- movement-table-column-menu.component.ts
    |                   +-- movement-table-column-menu.component.html
    |                   +-- movement-table.module.ts
    |                   +-- movement-table.service.ts
    |                   +-- movement-table-filter.service.ts
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

## Show customized information in the table

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

## Add translations

In order to see the translations for the generated table we need to run:

```bash
schematics ../<folder of the scheamtics project>/src/collection.json:i18n --dry-run=false
ng generate @esmf/semantic-ui-schematics:i18n --dry-run=false
```

This command will install in demo project the following libraries: "@jsverse/transloco": "6.x", "ngx-i18n-combine": "
^1.x"
And the translation file will be generated: en.movement-form.translation.json

## Export functionality

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

### Custom icons for the command bar

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

## Custom icons for each row

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

## Pre-load config file

If you want to use a pre-existing config file, without going through the generation wizard, you may feed the path to the
.json config using the 'configFile' flag by running the command like this:

```bash
ng generate @esmf/semantic-ui-schematics:table --configFile=<config-file-name>-wizard.configs.json
```

Example of configuration file:

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
  "customColumns": [],
  "addRowCheckboxes": false,
  "customRowActions": ["schedule"],
  "addCommandBar": true,
  "enabledCommandBarFunctions": ["addCustomCommandBarActions", "addSearchBar", "addEnumQuickFilters", "addDateQuickFilters"],
  "customCommandBarActions": ["edit.svg"],
  "enableRemoteDataHandling": true,
  "enableVersionSupport": true,
  "overwrite": true,
  "getOptionalMaterialTheme": false,
  "datePickers": [
    {
      "propertyUrn": "urn:samm:org.eclipse.test:1.0.0#datePicker",
      "datePicker": {
        "type": "singleDatePicker"
      }
    }
  ]
}
```

---

## Skip install

If you want to skip installation of dependencies you may use the '--skip-install' flag

```bash
ng generate @esmf/semantic-ui-schematics:table --skip-install
```

---

## Overwrite

If you want to overwrite the already existing generated files, you may use the '--overwrite' flag

```bash
ng generate @esmf/semantic-ui-schematics:table --overwrite
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

By default, the view encapsulation for the generated table component is set to None.
If you want to change the View Encapsulation strategy, you may use the '--viewEncapsulation' flag
where user can choose one of the following options: None, Emulated, ShadowDom.

when the wizard will prompt the question:

```bash
Do you want to specify view encapsulation strategy?
```

User may choose one of the values: None, Emulated, ShadowDom.
