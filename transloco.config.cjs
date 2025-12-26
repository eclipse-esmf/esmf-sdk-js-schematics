/*
 * Copyright Robert Bosch Manufacturing Solutions GmbH, Germany. All rights reserved.
 */

module.exports = {
  scopedLibs: [
    {
      src: './libs/schematic',
      dist: ['./libs/schematic/src/assets/i18n'],
    },
    {
      src: './libs/schematic',
      dist: ['./apps/demo/src/assets/i18n'],
    },
  ],
};
