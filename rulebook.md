# Rule Book for Creating `rules.yaml`

This rule book provides guidelines and examples for creating a comprehensive `rules.yaml` file. The file is used to define Open Policy Agent (OPA) rules for Kubernetes resources, Helm charts, and other deployment configurations. The structure of `rules.yaml` will help enforce various policies, such as security, resource constraints, and best practices.

## 1. Rule Structure

Each rule in `rules.yaml` follows this basic structure:

```yaml
- name: "<Rule Name>"
  match:
    kind: "<Kubernetes Kind>"
  conditions:
    - path: "<YAML Path in Manifest>"
      operator: "<Comparison Operator>"
      value: <Expected Value> # Optional based on operator
      value_from: "<Reference Path>" # Optional, if the value comes from another path
  message: "<Error Message>"
```
### Explanation:

- **name**: A descriptive name for the rule.
- **match**: Defines the Kubernetes resource kind the rule applies to.
- **conditions**: A list of conditions that trigger the rule.
  - **path**: The YAML path in the Kubernetes manifest.
  - **operator**: The comparison operator (`equals`, `exists`, `greater_than`, etc.).
  - **value**: The expected value for comparison (optional).
  - **value_from**: Pulls value from another YAML path (optional).
- **message**: The error message displayed when the rule fails.

---

## 2. Supported Kubernetes Kinds

You can apply rules to the following Kubernetes resource kinds:

- Pod
- Service
- Deployment
- DaemonSet
- StatefulSet
- Job
- CronJob
- PersistentVolumeClaim (PVC)
- NetworkPolicy
- Ingress
- ConfigMap
- Secret

## 3. Operators and Usage

Below are the operators available in the conditions:

| Operator     | Description                                       | Example                                                                           |
|--------------|---------------------------------------------------|-----------------------------------------------------------------------------------|
| equals       | Checks if a value equals the given value           | `path: spec.replicas`, `operator: equals`, `value: 3`                             |
| exists       | Checks if a field exists                           | `path: spec.ports`, `operator: exists`, `value: true`                             |
| greater_than | Checks if a value is greater than the given value  | `path: spec.ports[*].port`, `operator: greater_than`, `value: 30000`              |
| less_than    | Checks if a value is less than the given value     | `path: spec.ports[*].port`, `operator: less_than`, `value: 32767`                 |
| regex_match  | Validates against a regular expression             | `path: metadata.labels.app`, `operator: regex_match`, `value: "^frontend-.*"`     |
| in           | Checks if a value is in a set                      | `path: spec.type`, `operator: in`, `value: ["ClusterIP", "NodePort"]`             |
| not_equals   | Checks if a value is not equal to the given value  | `path: spec.securityContext.runAsUser`, `operator: not_equals`, `value: 0`        |

## 4. Conditional Logic

There are two ways to combine conditions:

- **All Conditions Must Pass**: Multiple conditions in a rule require all of them to be true for the rule to trigger.
- **Any Condition Can Pass**: To allow any one condition to trigger a rule, create separate conditions within the same rule.

## 5. Best Practice Rules

### 5.1 Pod Security Context

Ensure Pods do not have privileged containers.

```yaml
- name: "Deny Privileged Pods"
  match:
    kind: Pod
  conditions:
    - path: spec.containers[*].securityContext.privileged
      operator: equals
      value: true
  message: "Privileged containers are not allowed."
```
### 5.2 Service Port Validation
- ** Ensure that Service ports are within a certain range and disallow specific ports like 8080.
```yaml
- name: "Deny Service Port 8080"
  match:
    kind: Service
  conditions:
    - path: spec.ports[*].port
      operator: equals
      value: 8080
  message: "Service ports cannot be set to 8080."

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
```
### 5.3 Deployment Best Practices
- ** Ensure that Deployments specify the number of replicas.
```yaml
- name: "Ensure Replicas in Deployment"
  match:
    kind: Deployment
  conditions:
    - path: spec.replicas
      operator: exists
      value: true
  message: "Deployments must specify the number of replicas."

```
### 5.4 Network Policies
- ** Ensure that NetworkPolicy resources define egress ports.
```yaml
- name: "Ensure NetworkPolicy Egress"
  match:
    kind: NetworkPolicy
  conditions:
    - path: spec.egress[*].ports
      operator: exists
      value: true
  message: "NetworkPolicy must define egress ports."
```

### 5.5 PersistentVolumeClaim Storage Requests
- ** Ensure that PersistentVolumeClaims have storage requests defined.
```yaml
- name: "Ensure PersistentVolumeClaim Storage Request"
  match:
    kind: PersistentVolumeClaim
  conditions:
    - path: spec.resources.requests.storage
      operator: exists
      value: true
  message: "PersistentVolumeClaims must have storage requests."

```


### 5.6 Pod Affinity Rules
- ** Ensure Pods define affinity rules.
```yaml
- name: "Ensure Pod Affinity Rule"
  match:
    kind: Pod
  conditions:
    - path: spec.affinity.podAffinity
      operator: exists
      value: true
  message: "Pods must define affinity rules."
```

## 6. Helm Chart Validations
- ** For Helm chart resources, you can also apply similar rules. If you are using placeholders in Helm templates like .Values, ensure that those variables are properly validated in your rules.yaml.
- **  Example for Helm Chart Service:
```yaml
- name: "Helm Service Port Validation"
  match:
    kind: Service
  conditions:
    - path: spec.ports[*].port
      operator: equals
      value: "{{ .Values.servicePort }}"
  message: "Helm Service ports must not be set to the default value."
```
## 7. Guidelines for Writing Rules

You can apply rules to the following Kubernetes resource kinds:

- Identify Resource: Ensure that the kind specified in match corresponds to a Kubernetes resource.
- Use Specific Paths: Define precise YAML paths that directly reference the parts of the resource you want to validate.
- Apply Correct Operators: Use the right operators for comparison (e.g., equals for equality, exists for checking the presence of fields, etc.).
- Meaningful Error Messages: Craft error messages that make it clear why the rule is being violated and what action should be taken.
- Testing: After defining the rules, test them against actual Kubernetes manifests to ensure they work as expected.

## 8. Example of Full rules.yaml
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

  - name: "Ensure Replicas in Deployment"
    match:
      kind: Deployment
    conditions:
      - path: spec.replicas
        operator: exists
        value: true
    message: "Deployments must specify the number of replicas."

  - name: "Ensure NetworkPolicy Egress"
    match:
      kind: NetworkPolicy
    conditions:
      - path: spec.egress[*].ports
        operator: exists
        value: true
    message: "NetworkPolicy must define egress ports."
```
