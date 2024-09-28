Rule Book for Creating rules.yaml
This rule book provides guidelines and examples for creating a comprehensive rules.yaml file used to define Open Policy Agent (OPA) rules for Kubernetes resources, Helm charts, and other deployment configurations.

Table of Contents
Rule Structure
Supported Kubernetes Kinds
Operators and their Use
Conditional Logic
Comprehensive Rule Coverage
Guidelines for Writing Rules
Example of Full rules.yaml
Rule Structure
Each rule in rules.yaml follows this basic structure:

yaml

Verify

Open In Editor
Edit
Copy code
- name: "<Rule Name>"
  match:
    kind: "<Kubernetes Kind>"
  conditions:
    - path: "<YAML Path in Manifest>"
      operator: "<Comparison Operator>"
      value: <Expected Value> # Optional based on operator
      value_from: "<Reference Path>" # Optional, if the value comes from another path
  message: "<Error Message>"
Supported Kubernetes Kinds
The following Kubernetes resource kinds are supported:

Pod
Service
Deployment
DaemonSet
StatefulSet
Job
CronJob
PersistentVolumeClaim (PVC)
NetworkPolicy
Ingress
ConfigMap
Secret
Operators and their Use
The following operators can be used in the conditions:

Operator	Description	Example
equals	Checks if a value equals the given value.	path: spec.replicas operator: equals value: 3
exists	Checks if a field exists or not.	path: spec.ports operator: exists value: true
greater_than	Checks if a value is greater than the given value.	path: spec.ports[*].port operator: greater_than value: 30000
less_than	Checks if a value is less than the given value.	path: spec.ports[*].port operator: less_than value: 32767
regex_match	Validates the value against a regular expression.	path: metadata.labels.app operator: regex_match value: "^frontend-.*"
in	Checks if a value is part of a predefined set.	path: spec.type operator: in value: ["ClusterIP", "NodePort"]
not_equals	Checks if a value is not equal to the given value.	path: spec.securityContext.runAsUser operator: not_equals value: 0
Conditional Logic
There are two forms of conditional logic that can be applied in rules.yaml:

All Conditions Must Pass: When all conditions must pass for a rule to trigger, you can specify multiple conditions inside a rule.
Any Condition Can Pass: When any one condition can trigger a rule, you need to create separate conditions under the same rule.
Comprehensive Rule Coverage
Examples of best practices for various Kubernetes resources and how they can be reflected in the rules.yaml file:

Pod Security Context
Service Port Validation
Deployment Best Practices
Network Policies
PersistentVolumeClaim Storage Requests
Pod Affinity Rules
Helm Chart Validations
Guidelines for Writing Rules
Identify Resource: Ensure that the kind specified in match corresponds to a Kubernetes resource.
Use Specific Paths: Define precise YAML paths that directly reference the parts of the resource you want to validate.
Apply Correct Operators: Use the right operators for comparison (e.g., equals for equality, exists for checking the presence of fields, etc.).
Meaningful Error Messages: Craft error messages that make it clear why the rule is being violated and what action should be taken.
Testing: After defining the rules, test them against actual Kubernetes manifests to ensure they work as expected.
Example of Full rules.yaml
Here is an example of a full rules.yaml file:

yaml

Verify

Open In Editor
Edit
Copy code
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

