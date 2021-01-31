![Tests](https://github.com/jeffstephens/retention-manager/workflows/Tests/badge.svg)

[View on Docker Hub](https://hub.docker.com/r/jeffstephens/retention-manager)

# Retention Manager

Automatically delete old images in a private Docker registry according to rules in simple YAML. Useful for keeping small Docker registries from consuming too much disk space. Use at your own risk and make sure you can recreate any mission-critical images!

### A Note on Garbage Collection

This utility doesn't actually free any disk space until you run Docker's garbage collection, which you should research and run separately. The main caveat is that if you run it while an image is being uploaded, it can corrupt the new image.

If you're running your registry in Kubernetes, here's an example script you could run on a cron job. (You might need substitute appropriate values for the namespace and configuration path.)

```bash
#!/bin/bash
pod=$(kubectl get pods -n docker-registry | tail -n 1 | awk '{ print $1 }')
kubectl exec -n docker-registry $pod -- bin/registry garbage-collect /etc/docker/registry/config.yml
```

## Configuration

You can define a rule for any number of repositories as follows:

```yaml
registry: registry.example.com
policies:
  - repository: my-image
    maxTags: 5
```

The environmental variable `CONFIG_PATH` should point to this file on disk.

## Example: Kubernetes CronJob

> For a drop-in solution, check the `helm/` directory!

A typical use case is a daily cron job. No additional Kubernetes permissions are required, but you do need to pass in your Docker registry credentials.

```yaml
# create secret with credentials (don't forget to base64-encode)
apiVersion: v1
kind: Secret
metadata:
  name: secret-env
data:
  REGISTRY_PASSWORD: ...
  REGISTRY_USERNAME: ...
---
# create ConfigMap with config yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: retention-manager
data:
  config.yaml: |
    registry: registry.example.com
    policies:
      - repository: my-image
        maxTags: 5
---
# create CronJob referencing both of the following resources
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: retention-manager
spec:
  # sometime overnight in California
  schedule: "0 11 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          volumes:
            - name: config
              configMap:
                name: retention-manager
                items:
                  - key: config.yaml
                    path: config.yaml
          containers:
            - name: retention-manager
              image: jeffstephens/retention-manager:1.0.5
              imagePullPolicy: IfNotPresent
              env:
                - name: CONFIG_PATH
                  value: /retention-manager/config.yaml
                - name: REGISTRY_PASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: secret-env
                      key: REGISTRY_PASSWORD
                - name: REGISTRY_USERNAME
                  valueFrom:
                    secretKeyRef:
                      name: secret-env
                      key: REGISTRY_USERNAME
              volumeMounts:
                - name: config
                  mountPath: /retention-manager
                  readOnly: true
```
