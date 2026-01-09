#!/bin/sh
#
# Copyright Robert Bosch Manufacturing Solutions GmbH, Germany. All rights reserved.
#

echo "Retrieve staged files that match the specified patterns"
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '^libs/schematic.*/assets/i18n/.*.json$')

if [ "$STAGED_FILES" = "" ]; then
  exit 0
fi

echo "Format the staged files"
transloco-scoped-libs --skip-gitignore

# Add the updated files back to the staging area
git diff --name-only --diff-filter=M | grep '\.vendor\.json$' | xargs git add

exit 0
