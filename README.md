# StaticKuber - Kubernetes Static Code Analyzer for VS Code

StaticKuber is a VS Code extension designed to help developers and DevOps professionals validate Kubernetes YAML configurations and Helm templates in real-time. The extension enforces best practices and security standards by automatically validating manifests against user-defined policies stored in `rules.yaml`. StaticKuber also supports dynamic `.rego` file generation for OPA (Open Policy Agent) policy enforcement.

## Key Features

- **Dynamic Rule Validation**: Validate Kubernetes YAML files against user-defined policies in the `rules.yaml` file.
- **Helm Template Support**: Render Helm templates into standard YAML for validation.
- **Real-Time Feedback**: Provides immediate feedback on policy violations whenever Kubernetes manifests are saved.
- **Custom Policy Support**: Define and manage your own custom rules in YAML format, which are then converted to `.rego` files for OPA-based validation.
- **Security Best Practices**: Detect common Kubernetes misconfigurations like privileged containers, missing resource limits, invalid port ranges, and more.
- **Extensible and Scalable**: Easily add new rules for any Kubernetes resource type such as `Pod`, `Deployment`, `Service`, `NetworkPolicy`, and more.

## How It Works

StaticKuber monitors Kubernetes manifests and Helm templates in your workspace. Upon saving a file, the extension performs the following steps:

1. **File Type Detection**: Determines whether the file is a Kubernetes manifest or a Helm template.
2. **Helm Template Rendering**: If it's a Helm template, it sanitizes and renders it into standard Kubernetes YAML.
3. **Rule Validation**: The file is validated against the rules defined in `rules.yaml`.
4. **Dynamic Rego File Generation**: A `.rego` file is generated based on the YAML rules and is used to validate the manifest using OPA.
5. **Policy Enforcement**: If any violations are found, the user is immediately notified in the editor with details on the rule violation.

## Installation

1. Install **StaticKuber** from the VS Code Marketplace (link will be added when published).
2. Ensure you have [Open Policy Agent (OPA)](https://www.openpolicyagent.org/docs/latest/#running-opa) installed and available in your system's PATH.
3. (Optional) Install [Helm](https://helm.sh/) if you're working with Helm charts.
4. Create a `policies/rules.yaml` file in your project's root directory to define custom validation rules.


## Rule Definitions in `rules.yaml`

The core of StaticKuber is its ability to dynamically generate `.rego` files based on policies defined in `rules.yaml`. Below is a typical structure for `rules.yaml`:

### Example `rules.yaml` File

```yaml
rules:
  - name: "Deny Privileged Pods"
    match:
      kind: Pod
    conditions:
      - path: spec.containers[*].securityContext.privileged
        operator: equals
        value: true
    message: "Privileged containers are not allowed."

  - name: "Service Port Range Validation"
    match:
      kind: Service
    conditions:
      - path: spec.ports[*].port
        operator: greater_than
        value: 30000
      - path: spec.ports[*].port
        operator: less_than
        value: 32767
    message: "Service ports must be within the range 30000-32767."

  - name: "Ensure Resource Requests and Limits"
    match:
      kind: Pod
    conditions:
      all:
        - path: spec.containers[*].resources.requests.memory
          operator: exists
        - path: spec.containers[*].resources.limits.cpu
          operator: exists
    message: "Containers must have resource requests and limits for memory and CPU."

  - name: "App Label Validation"
    match:
      kind: Pod
    conditions:
      - path: metadata.labels.app
        operator: regex_match
        value: "^frontend-.*"
    message: "All apps must have a label starting with 'frontend-'."

```
### Supported Condition Operators

1.equals: Checks if a field matches a specific value.
2.exists: Ensures that a field is present in the YAML.
3.greater_than: Ensures that a numeric value is greater than the specified value.
4.less_than: Ensures that a numeric value is less than the specified value.
5.regex_match: Validates if a field matches a regular expression.

# Usage 
1. Adding Custom Rules:

To define custom policies for your Kubernetes manifests:
- Create a policies/rules.yaml file in the root of your workspace.
- Add your validation rules using the provided structure.
- Save your Kubernetes YAML or Helm template file, and StaticKuber will automatically validate it against your rules.

### Detailed usesage 
#### How to Use statickuber
- ** This section provides a step-by-step guide for developers on how to use the statickuber extension, including the expected errors and results they might encounter.

- Installation
-- Step 1: Install the Extension
--- Go to the Visual Studio Code Extensions marketplace.
--- Search for statickuber and click the Install button.
--- Alternatively, download the extension .vsix file and install it manually using Install from VSIX in VS Code.
--- Setting Up the Project
-- Step 2: Create a Project Folder
--- Open your Kubernetes or Helm project folder in Visual Studio Code.
--- Ensure your project contains Kubernetes manifests (.yaml files) and a folder to store your custom OPA policy rules.
-- Step 3: Create a policies Folder
--- Inside the root of your project, create a folder called policies. This folder will contain your rules.yaml file where you define your custom OPA rules.
-- Step 4: Define Rules in rules.yaml
--- Inside the policies folder, create a rules.yaml file.
--- Write custom validation rules for Kubernetes manifests or Helm charts in this file.
---Here is an example of rules.yaml content:

```yaml
rules:
  - name: "Deny Privileged Pods"
    match:
      kind: Pod
    conditions:
      - path: spec.containers[*].securityContext.privileged
        operator: equals
        value: true
    message: "Privileged containers are not allowed."

  - name: "Deny Service Port 8080"
    match:
      kind: Service
    conditions:
      - path: spec.ports[*].port
        operator: equals
        value: 8080
    message: "Service ports cannot be set to 8080."
```
-  Usage and Validation
-- Step 5: Automatic Validation on Save
--- Once the extension is installed, it will automatically validate your Kubernetes manifests (.yaml files) when they are saved.
--- If a violation occurs based on the rules defined in your rules.yaml, the extension will notify you of the violation.
-- Step 6: Manual Validation Command
--- You can also manually trigger validation by using the command palette in VS Code.
--- Press Ctrl+Shift+P (or Cmd+Shift+P on Mac) and search for StaticKuber: Validate Kubernetes Manifest.
--- Select the command to run validation on the open YAML file.
- Expected Errors and Results
-- Expected Results on Rule Violations:
-- Error Notification: If a Kubernetes manifest file does not meet the rules defined in rules.yaml, a warning or error message will be displayed in VS Code.

--- Example: If the rule Deny Privileged Pods is violated, you'll see an error message like:
---- Privileged containers are not allowed.
---- Red Underline: The line in the Kubernetes manifest where the violation occurred will be underlined in red.

---- Expected Results on Successful Validation:
---- Information Notification: If no violations are found, a success message will appear:

No policy violations found.
5. Handling Helm Charts
Step 7: Validating Helm Templates
If your project uses Helm, statickuber will automatically detect Helm templates and render them into valid YAML before validation.

Define Helm-specific rules in rules.yaml using placeholders like .Values.

Example Helm rule:

```yaml
Copy code
- name: "Helm Service Port Validation"
  match:
    kind: Service
  conditions:
    - path: spec.ports[*].port
      operator: equals
      value: "{{ .Values.servicePort }}"
  message: "Helm Service ports must not be set to the default value."
```
Step 8: Custom Helm Values
You can specify custom values.yaml files for rendering Helm templates by configuring the extension settings in VS Code.
Go to Settings > Extensions > StaticKuber and set the path to your custom values.yaml.
6. Developer Workflow and Testing
Step 9: Testing Rules with Real YAML Files
Test your rules.yaml by writing Kubernetes manifests and saving the files.
Violations will immediately appear if the rules are not satisfied.
Step 10: Modifying Rules
Developers can modify the rules.yaml to add or remove rules and save the file. The extension will regenerate the corresponding Rego files and apply the new rules.





2. Validating Helm Templates:

If you are working with Helm templates, StaticKuber will:
- Render the Helm template into a Kubernetes manifest using the helm template command.
- Sanitize any Helm-specific syntax.
- Validate the rendered YAML against the custom policies defined in rules.yaml.

3. Real-Time Feedback:
- Whenever you save a Kubernetes YAML or Helm template file, StaticKuber automatically validates the file and provides real-time. 
- feedback. Any rule violations will be shown in the editor as error or warning messages, with a description of the violation.

# Supported Kubernetes Resource Types
- ** StaticKuber supports validation of various Kubernetes resources, including but not limited to:

- Pod
- Deployment
- Service
- NetworkPolicy
- ConfigMap
- Secret
- StatefulSet
- DaemonSet
- Ingress
- PersistentVolumeClaim
- HorizontalPodAutoscaler

- ** You can easily add new rules for these resources by updating the rules.yaml file.
# Rule Book  
- https://github.com/karti479/statickuber/blob/main/rulebook.md

# Requirements
- Visual Studio Code
- Open Policy Agent (OPA) installed and available in your system PATH.
- (Optional) Helm installed if working with Helm templates.

# Known Issues
- Helm templates: Rendering complex Helm charts may sometimes require additional configurations (e.g., passing values through --values flags).
- Unsupported Kubernetes Versions: Ensure that your Kubernetes manifests are compatible with the latest Kubernetes API versions.
- Future Features
- Enhanced UI Feedback: Improved integration with the VS Code problem panel for viewing policy violations.
- Auto-fix Suggestions: Suggest automatic fixes for common Kubernetes misconfigurations.
- Custom OPA Policy Support: Allow users to load and apply custom OPA policies directly from their workspace.
- CI/CD Integration: Future integration with CI/CD pipelines for policy checks during build and deployment stages.

# Release Notes
1.0.0
## Initial release of StaticKuber.
- Supports dynamic .rego generation from rules.yaml.
- Validates Kubernetes YAML files and Helm templates.
- Real-time feedback on policy violations.
- Custom rule support for various Kubernetes resources.

# Contributing
If you'd like to contribute to StaticKuber, feel free to fork the repository and open a pull request. All contributions are welcome!

# License
This project is licensed under the Opne source for StaticKuber
