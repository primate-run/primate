#!/usr/bin/env bash
rm -r components/content
cp -a ../../docs components/content
npx primate@0.31.13 serve
