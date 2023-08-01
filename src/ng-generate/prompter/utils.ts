import {Answers} from "inquirer";
import {Aspect, AspectModelLoader} from "@esmf/aspect-model-loader";
import {Tree} from "@angular-devkit/schematics/src/tree/interface";
import {TemplateHelper} from "../../utils/template-helper";
import {lastValueFrom, Subscriber} from "rxjs";
import fs from "fs";
import {virtualFs} from "@angular-devkit/core";
import {WIZARD_CONFIG_FILE} from "./index";

export const loader = new AspectModelLoader();
export let aspect: Aspect;

export function handleAspectModelUrnToLoad(allAnswers: any, tree: any, answer: Answers) {
    const itemIndex = allAnswers.aspectModelTFiles.indexOf(answer.answer);
    if (itemIndex) {
        allAnswers.aspectModelTFiles.splice(itemIndex, 1);
        allAnswers.aspectModelTFiles.unshift(answer.answer);
    }

    waitForAspectLoad(allAnswers, tree).then((aspect: Aspect) => {
        allAnswers[answer.name] = aspect.aspectModelUrn;
    });
}

export async function waitForAspectLoad(allUserResponses: any, treeStructure: Tree): Promise<Aspect> {
    return loadAspectModel(allUserResponses, treeStructure);
}

export async function loadAspectModel(allUserResponses: any, treeStructure: Tree): Promise<Aspect> {
    if (aspect) {
        return aspect;
    }

    const ttlFileContents: Array<string> = [];
    allUserResponses.aspectModelTFiles.forEach((ttlFile: any) => {
        if (typeof ttlFile === 'string' && ttlFile.endsWith('.ttl')) {
            const filePath = `${treeStructure.root.path}${ttlFile.trim()}`;
            const fileData: any = treeStructure.read(filePath);
            ttlFileContents.push(virtualFs.fileBufferToString(fileData));
        }
    });

    try {
        if (ttlFileContents.length > 1) {
            aspect = await lastValueFrom<Aspect>(loader.load(allUserResponses.aspectModelUrnToLoad, ...ttlFileContents));
        } else {
            aspect = await lastValueFrom(loader.loadSelfContainedModel(ttlFileContents[0]));
        }

        return aspect;
    } catch (error) {
        console.error(error);
        throw error;
    }
}


export function handleComplexPropList(allAnswers: any, answer: Answers) {
    const newEntry = {
        prop: answer.name.replace('complexPropList', '').split(',')[0],
        entityUrn: answer.name.replace('entityUrn', '').split(',')[1],
        propsToShow: answer.answer.map((answer: any) => {
            const property = loader.findByUrn(answer);
            const name = !property ? answer.split('#')[1] : property.name;
            const aspectModelUrn = !property ? answer : property.aspectModelUrn;
            return {
                name: name,
                aspectModelUrn: aspectModelUrn,
            };
        }),
    };

    allAnswers.complexProps.push(newEntry);
}

export function updateAnswer(aspect: Aspect, allAnswers: any, answer: Answers) {
    if (answer.name === 'selectedModelElementUrn' && answer.answer === '') {
        answer.answer = new TemplateHelper().resolveType(aspect);
    }
    allAnswers[answer.name] = answer.answer;
}

export function writeConfigAndExit(subscriber: Subscriber<Tree>, tree: Tree, config: any, fromImport = false) {
    fs.writeFile(WIZARD_CONFIG_FILE, JSON.stringify(config), 'utf8', error => {
        if (error) {
            console.log('Error during serialization process');
            throw error;
        }

        console.log('\x1b[33m%s\x1b[0m', fromImport
            ? `The import was successful, the config used for your generation can be found here: ${WIZARD_CONFIG_FILE}`
            : `New config file was generated based on your choices, it can be found here: ${WIZARD_CONFIG_FILE}`
        );

        subscriber.next(tree);
        subscriber.complete();
    });
}
