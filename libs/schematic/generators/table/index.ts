import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';

export default function (options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    tree.create(`my-file.txt`, `Hello, ${options.name}! This is an updated schematic.`);
    return tree;
  };
}
