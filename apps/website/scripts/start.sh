#!/usr/bin/env bash
rm -rf components/content
cp -a ../../docs components/content
npx primate serve
