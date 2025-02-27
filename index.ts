/*
 *  Licensed to the Kassenärztliche Bundesvereinigung (KBV) (c) 2020 - 2022 under one
 *  or more contributor license agreements. See the NOTICE file
 *  distributed with this work for additional information
 *  regarding copyright ownership. The KBV licenses this file
 *  to you under the Apache License, Version 2.0 (the
 *  "License"); you may not use this file except in compliance
 *  with the License. You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied. See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */

import * as fs from "fs";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const emptyFunction = () => {};

export function readDir(path: string): string[] | undefined {
    if (fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {
        return fs.readdirSync(path);
    } else {
        console.log("dir: '" + path + "' not found..");
        return undefined;
    }
}

export function readFile(path: string): string | undefined {
    if (fs.existsSync(path) && fs.lstatSync(path).isFile()) {
        return fs.readFileSync(path, "utf8");
    } else {
        console.log("file: '" + path + "' not found..");
        return undefined;
    }
}

export function readFileAsBlob(path: string): Blob | undefined {
    if (fs.existsSync(path) && fs.lstatSync(path).isFile()) {
        return new Blob([fs.readFileSync(path)]);
    } else {
        console.log("file: '" + path + "' not found..");
        return undefined;
    }
}

export function readJSONFile(path: string): Record<string, unknown> | undefined {
    const data = readFile(path);
    if (data) {
        try {
            return JSON.parse(data) as Record<string, unknown>;
        } catch (err) {
            throw new Error("Error parsing json.. ");
        }
    }
}

export type MIO = "IM" | "ZB" | "MR" | "UH" | "PKA";
const MIOs: MIO[] = ["IM", "ZB", "MR", "UH", "PKA"];
export { MIOs };

export type MIOType = {
    mio: MIO;
};

const BasicList: MIOType[] = [];
MIOs.forEach((mio) => {
    BasicList.push({ mio });
});

export { BasicList };

const basePath: string = path.resolve("./node_modules/@kbv/miotestdata");
process.stdout.write("Base path: " + basePath);

export type DefinitionType = "Bundles" | "Profiles";

export function getExamples(
    mio: MIO,
    version: string,
    type: DefinitionType,
    valid = true
): string[] {
    const rootPath = `${basePath}/data/${type.toLowerCase()}/${mio}/${version}${
        valid ? "" : "/Error"
    }`;

    const files = readDir(rootPath);
    const results: string[] = [];
    const mappedFiles = files ? files.map((file) => `${rootPath}/${file}`) : [];

    mappedFiles.forEach((file) => {
        if (fs.lstatSync(file).isFile()) results.push(file);
    });

    return results;
}

export function getExample(
    filePath: string,
    rootPath = `${basePath}`
): string | undefined {
    return readFile(rootPath + filePath);
}

export function runAll<T extends MIOType>(
    name: string,
    list: T[],
    testFunction: (bundles: string[], value: T, version?: string) => void,
    type: DefinitionType,
    valid = true,
    setupFn: () => void = emptyFunction
): void {
    setupFn();
    describe(name, () => {
        list.forEach((value) => {
            describe(`Examples ${value.mio} (${type})`, () => {
                const mioPath = `${basePath}/data/${type.toLowerCase()}/${value.mio}`;

                const versions = fs.readdirSync(mioPath);

                versions.forEach((version) => {
                    describe(`Version ${version}`, () => {
                        const bundles = getExamples(value.mio, version, type, valid);
                        if (!bundles.length)
                            console.warn(
                                "A data folder should not be empty! " +
                                    value.mio +
                                    "|" +
                                    version +
                                    " (" +
                                    type +
                                    ")"
                            );
                        expect(bundles.length).toBeGreaterThan(0);
                        testFunction(bundles, value, version);
                    });
                });
            });
        });
    });
}

export function runAllFiles<T extends MIOType>(
    name: string,
    list: T[],
    testFunction: (bundles: string, value: T, version?: string) => void,
    type: DefinitionType,
    valid = true,
    setupFn: () => void = emptyFunction
): void {
    runAll<T>(
        name,
        list,
        (bundles, value, version) => {
            bundles.forEach((file) => testFunction(file, value, version));
        },
        type,
        valid,
        setupFn
    );
}

export function runAllBundleFiles(
    name: string,
    testFunction: (file: string, value: MIOType, version?: string) => void,
    valid = true,
    setupFn: () => void = emptyFunction
): void {
    runAllFiles(name, BasicList, testFunction, "Bundles", valid, setupFn);
}

export function runAllBundles(
    name: string,
    testFunction: (file: string[], value: MIOType, version?: string) => void,
    valid = true,
    setupFn: () => void = emptyFunction
): void {
    runAll(name, BasicList, testFunction, "Bundles", valid, setupFn);
}

export function runAllProfileFiles(
    name: string,
    testFunction: (file: string, value: MIOType, version?: string) => void,
    valid = true,
    setupFn: () => void = emptyFunction
): void {
    runAllFiles(name, BasicList, testFunction, "Profiles", valid, setupFn);
}

export function runAllProfiles<T extends MIOType>(
    name: string,
    testFunction: (file: string[], value: MIOType, version?: string) => void,
    valid = true,
    setupFn: () => void = emptyFunction
): void {
    runAll(name, BasicList, testFunction, "Profiles", valid, setupFn);
}
