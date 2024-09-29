Rule Book for rules.yaml
This rule book provides guidelines for defining rules in the rules.yaml file. These rules are used to validate Kubernetes resources, Helm charts, and deployment configurations to ensure security, resource constraints, and best practices are followed.

Table of Contents
Rule Structure
Supported Kubernetes Kinds
Operators and Usage
Conditional Logic
Best Practice Rules Examples
Pod Security Context
Service Port Validation
Deployment Best Practices
Network Policies
PersistentVolumeClaim Storage Requests
Pod Affinity Rules
Helm Chart Validations
Writing New Rules
1. Rule Structure
Each rule in rules.yaml follows this basic structure:

yaml
- name: "<Rule Name>"
  match:
    kind: "<Kubernetes Kind>"
  conditions:
    - path: "<YAML Path in Manifest>"
      operator: "<Comparison Operator>"
      value: <Expected Value>  # Optional, based on operator
      value_from: "<Reference Path>"  # Optional, if the value comes from another path
  message: "<Error Message>"
Explanation:
name: A descriptive name for the rule.
match: Defines the Kubernetes resource kind the rule applies to.
conditions: A list of conditions that trigger the rule:
path: The YAML path in the Kubernetes manifest.
operator: The comparison operator (equals, exists, greater_than, etc.).
value: The expected value for comparison (optional).
value_from: Pulls value from another YAML path (optional).
message: Error message displayed when the rule fails.
2. Supported Kubernetes Kinds
You can apply rules to the following Kubernetes resource kinds:

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
3. Operators and Usage
Below are the operators available in the conditions:

Operator	Description	Example
equals	Checks if a value equals the given value	path: spec.replicas, operator: equals, value: 3
exists	Checks if a field exists	path: spec.ports, operator: exists, value: true
greater_than	Checks if a value is greater	path: spec.ports[*].port, operator: greater_than, value: 30000
less_than	Checks if a value is less	path: spec.ports[*].port, operator: less_than, value: 32767
regex_match	Validates against a regular expression	path: metadata.labels.app, operator: regex_match, value: "^frontend-.*"
in	Checks if a value is in a set	path: spec.type, operator: in, value: ["ClusterIP", "NodePort"]
not_equals	Checks if a value does not equal	path: spec.securityContext.runAsUser, operator: not_equals, value: 0
4. Conditional Logic
There are two ways to combine conditions:

1. All Conditions Must Pass
Multiple conditions in a rule require all of them to be true for the rule to trigger.

2. Any Condition Can Pass
To allow any one condition to trigger a rule, create separate conditions within the same rule.

5. Best Practice Rules Examples
5.1 Pod Security Context
Ensure Pods do not have privileged containers.

yaml
Copy code
- name: "Deny Privileged Pods"
  match:
    kind: Pod
  conditions:
    - path: spec.containers[*].securityContext.privileged
      operator: equals
      value: true
  message: "Privileged containers are not allowed."
5.2 Service Port Validation
Disallow the use of port 8080 for services.

yaml
Copy code
- name: "Deny Service Port 8080"
  match:
    kind: Service
  conditions:
    - path: spec.ports[*].port
      operator: equals
      value: 8080
  message: "Service ports cannot be set to 8080."
Ensure service ports are within a specific range.

yaml
Copy code
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
5.3 Deployment Best Practices
Ensure Deployments specify the number of replicas.

yaml
Copy code
- name: "Ensure Replicas in Deployment"
  match:
    kind: Deployment
  conditions:
    - path: spec.replicas
      operator: exists
      value: true
  message: "Deployments must specify the number of replicas."
5.4 Network Policies
Ensure NetworkPolicies define egress ports.

yaml
Copy code
- name: "Ensure NetworkPolicy Egress"
  match:
    kind: NetworkPolicy
  conditions:
    - path: spec.egress[*].ports
      operator: exists
      value: true
  message: "NetworkPolicy must define egress ports."
5.5 PersistentVolumeClaim Storage Requests
Ensure PersistentVolumeClaims have storage requests defined.

yaml
Copy code
- name: "Ensure PersistentVolumeClaim Storage Request"
  match:
    kind: PersistentVolumeClaim
  conditions:
    - path: spec.resources.requests.storage
      operator: exists
      value: true
  message: "PersistentVolumeClaims must have storage requests."
5.6 Pod Affinity Rules
Ensure Pods define affinity rules.

yaml
Copy code
- name: "Ensure Pod Affinity Rule"
  match:
    kind: Pod
  conditions:
    - path: spec.affinity.podAffinity
      operator: exists
      value: true
  message: "Pods must define affinity rules."
6. Helm Chart Validations
For Helm charts, you can create rules that apply to templated values. For example:

yaml
Copy code
- name: "Helm Service Port Validation"
  match:
    kind: Service
  conditions:
    - path: spec.ports[*].port
      operator: equals
      value: "{{ .Values.servicePort }}"
  message: "Helm Service ports must not be set to the default value."
7. Writing New Rules
When creating new rules in the rules.yaml file, follow these steps:

Identify the Resource: Make sure the kind in the match section corresponds to a valid Kubernetes resource.
Specify Accurate Paths: Use correct and precise YAML paths.
Use Relevant Operators: Choose the appropriate operator for your comparison (e.g., equals, exists, etc.).
Meaningful Messages: Ensure the error message is informative and clear.
Test Your Rules: After writing new rules, test them on your Kubernetes manifests to ensure they behave as expected.
This guide should help you define robust rules for Kubernetes validation using the rules.yaml file. Ensure that you maintain the structure and best practices outlined here for effective policy enforcement.

