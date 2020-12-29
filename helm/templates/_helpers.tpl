{{/*
Create an env entry for each secret
*/}}
{{- define "helpers.list-secrets"}}
{{- range $key, $val := .Values.env }}
- name: {{ $key }}
  valueFrom:
    secretKeyRef:
      name: secret-env
      key: {{ $key }}
{{- end}}
{{- end }}
