#!/bin/bash

helm upgrade -i \
    retention-manager \
    . \
    --namespace retention-manager \
    --create-namespace
