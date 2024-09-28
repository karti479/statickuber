import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

// Define interfaces for better type safety
interface Rule {
    name: string;
    match: {
        kind: string;
    };
    conditions: Array<{
        path: string;
        operator: string;
        value?: any;
        value_from?: string;
    }>;
    message: string;
}

interface RulesFile {
    rules: Rule[];
}

// Activate the extension
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.validateKubernetesManifest', () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.languageId === 'yaml') {
            const filePath = activeEditor.document.fileName;
            runValidation(filePath);
        }
    });

    vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
        if (document.languageId === 'yaml') {
            const filePath = document.fileName;
            runValidation(filePath);
        }
    });

    context.subscriptions.push(disposable);
}

// Function to validate the Kubernetes manifest or Helm template
async function runValidation(filePath: string) {
    try {
        const isHelmTemplate = detectHelmTemplate(filePath);

        if (isHelmTemplate) {
            const isHelmAvailable = await checkHelmAvailability();
            if (isHelmAvailable) {
                const renderedFilePath = await renderHelmTemplate(filePath);
                await generateRegoFile();
                await validateYamlFile(renderedFilePath);
            } else {
                vscode.window.showWarningMessage("Helm is not installed or not in your PATH. Proceeding as regular YAML with sanitized Helm syntax.");
                const sanitizedFilePath = sanitizeHelmTemplate(filePath);
                const sanitizedContent = fs.readFileSync(sanitizedFilePath, 'utf-8');
                if (validateYamlStructure(sanitizedContent)) {
                    await generateRegoFile();
                    await validateYamlFile(sanitizedFilePath);
                }
            }
        } else {
            await generateRegoFile();
            await validateYamlFile(filePath);
        }
    } catch (error) {
        handleError(error);
    }
}

// Function to dynamically generate the `.rego` file from `rule.yaml`
async function generateRegoFile() {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
        const ruleFilePath = path.join(workspaceFolder, 'policies', 'rules.yaml');
        const regoFilePath = path.join(workspaceFolder, 'policies', 'generated.rego');
        
        console.log("Rule file path: ", ruleFilePath);
        console.log("Rego file path: ", regoFilePath);

        if (!fs.existsSync(ruleFilePath)) {
            vscode.window.showErrorMessage("Rule file 'rules.yaml' not found in 'policies' folder.");
            console.error("Rule file 'rules.yaml' not found at: ", ruleFilePath);
            return;
        }

        let ruleContent: string;
        try {
            console.log("Reading rules.yaml file...");
            ruleContent = fs.readFileSync(ruleFilePath, 'utf-8');
        } catch (readError) {
            vscode.window.showErrorMessage("Failed to read 'rules.yaml'. Check the file permissions.");
            console.error("Error reading 'rules.yaml': ", readError);
            return;
        }

        let ruleData: RulesFile;
        try {
            console.log("Parsing rules.yaml file...");
            ruleData = yaml.load(ruleContent) as RulesFile;
        } catch (parseError) {
            vscode.window.showErrorMessage("Failed to parse 'rules.yaml'. Ensure it is valid YAML.");
            console.error("Error parsing 'rules.yaml': ", parseError);
            return;
        }

        if (!ruleData || !ruleData.rules || !Array.isArray(ruleData.rules)) {
            vscode.window.showErrorMessage("Invalid structure in 'rules.yaml'. Expected a 'rules' array.");
            console.error("Invalid structure in 'rules.yaml': ", ruleData);
            return;
        }

        console.log("Building the .rego file content...");
        let regoFileContent = `package kubernetes.security\n\n`;

        ruleData.rules.forEach((rule: Rule) => {
            regoFileContent += `deny[reason] {\n`;
            regoFileContent += `  input.kind == "${rule.match.kind}"\n`;

            rule.conditions.forEach((condition) => {
                const operatorMapping: any = {
                    "equals": "==",
                    "exists": "!=",
                    "greater_than": ">",
                    "less_than": "<",
                    "regex_match": "re_match",
                };

                const operator = operatorMapping[condition.operator] || condition.operator;
                const path = condition.path.replace(/\[\*\]/g, "[_]");

                if (condition.operator === 'regex_match') {
                    regoFileContent += `  ${operator}("${condition.value}", input.${path})\n`;
                } else if (condition.operator === 'exists') {
                    regoFileContent += `  input.${path} ${operator} null\n`;
                } else if (condition.value_from) {
                    const valueFromPath = condition.value_from.replace(/\[\*\]/g, "[_]");
                    regoFileContent += `  input.${path} ${operator} input.${valueFromPath}\n`;
                } else {
                    regoFileContent += `  input.${path} ${operator} ${JSON.stringify(condition.value)}\n`;
                }
            });

            regoFileContent += `  reason := "${rule.message}"\n`;
            regoFileContent += `}\n\n`;
        });

        try {
            console.log("Writing the generated.rego file...");
            fs.writeFileSync(regoFilePath, regoFileContent);
            console.log(`Generated rego file at: ${regoFilePath}`);
            console.log("Rego file content:\n" + regoFileContent);
            vscode.window.showInformationMessage(`Rego file generated successfully at: ${regoFilePath}`);
        } catch (writeError) {
            vscode.window.showErrorMessage("Failed to write 'generated.rego'. Check folder permissions.");
            console.error("Error writing 'generated.rego': ", writeError);
        }
    } catch (error) {
        console.error("Unexpected error generating rego file: ", error);
        vscode.window.showErrorMessage("Unexpected error generating rego file. Check logs for details.");
    }
}

// Function to render Helm templates into valid YAML using 'helm template'
async function renderHelmTemplate(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const helmCommand = `helm template ${filePath} --values values.yaml --output-dir ./rendered-output`;
        exec(helmCommand, (error, stdout, stderr) => {
            if (error || stderr) {
                if (error !== null && error !== undefined) {
                    reject(new Error(stderr || error.message));
                } else {
                    reject(new Error('Unknown error occurred.'));
                }
            } else {
                const renderedFilePath = path.join(path.dirname(filePath), 'rendered-output', 'kube.yaml');
                resolve(renderedFilePath);
            }
        });
    });
}

// Function to detect if the file contains Helm templating syntax
function detectHelmTemplate(filePath: string): boolean {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.includes('{{') || content.includes('}}') || content.includes('.Values') || content.includes('include ');
}

// Function to check if Helm is available in the system
async function checkHelmAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
        exec('helm version', (error, stdout, stderr) => {
            if (error || stderr.includes('not recognized')) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

// Sanitize Helm templates by replacing specific placeholders with default values
function sanitizeHelmTemplate(filePath: string): string {
    const content = fs.readFileSync(filePath, 'utf-8');

    const sanitizedContent = content
        .replace(/{{\s*\.Values\.config\.dependencyScanner\s*}}/g, 'default-dependency-scanner')
        .replace(/{{\s*\.Values\.config\.vulnerabilityDatabase\s*}}/g, 'default-vulnerability-database')
        .replace(/{{\s*include\s*".*?"\s*.*?}}/g, 'default-name')
        .replace(/{{.*?}}/g, '');

    const sanitizedFilePath = path.join(path.dirname(filePath), 'sanitized.yaml');
    fs.writeFileSync(sanitizedFilePath, sanitizedContent);

    console.log(`Sanitized YAML content:\n${sanitizedContent}`);
    return sanitizedFilePath;
}

// Validate the structure of the sanitized YAML
function validateYamlStructure(sanitizedContent: string): boolean {
    try {
        const parsedYaml = yaml.load(sanitizedContent);
        if (parsedYaml && typeof parsedYaml === 'object') {
            return true;
        } else {
            vscode.window.showErrorMessage('Invalid YAML structure after sanitization.');
            return false;
        }
    } catch (error) {
        vscode.window.showErrorMessage('Error parsing sanitized YAML: ' + (error instanceof Error ? error.message : String(error)));
        return false;
    }
}

// Validate regular Kubernetes YAML files using OPA
async function validateYamlFile(filePath: string) {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '';
        const regoFilePath = path.join(workspaceFolder, 'policies', 'generated.rego').replace(/\\/g, '/');
        const sanitizedFilePath = filePath.replace(/\\/g, '/');

        console.log(`Sanitized file path: ${sanitizedFilePath}`);
        console.log(`Rego file path: ${regoFilePath}`);

        const command = `opa eval --input "${sanitizedFilePath}" --data "${regoFilePath}" "data.kubernetes.security.deny"`;
        console.log(`Running OPA command: ${command}`);

        const output = await execCommand(command);

        if (output) {
            vscode.window.showWarningMessage(output);
        } else {
            vscode.window.showInformationMessage('No policy violations found.');
        }
    } catch (error) {
        handleError(error);
    }
}

// Execute a shell command and return the result
async function execCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error || stderr) {
                if (error !== null && error !== undefined) {
                    reject(new Error(stderr || error.message));
                } else {
                    reject(new Error('Unknown error occurred.'));
                }
            } else {
                resolve(stdout);
            }
        });
    });
}

// Handle errors in a user-friendly way
function handleError(error: unknown) {
    if (error instanceof Error) {
        console.error(error);
        vscode.window.showErrorMessage(error.message || 'An unknown error occurred.');
    } else {
        console.error(String(error));
        vscode.window.showErrorMessage('An unknown error occurred.');
    }
}

// Deactivate the extension
export function deactivate() {}

