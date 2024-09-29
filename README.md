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

## detailed usesage - 

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
