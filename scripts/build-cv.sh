#!/usr/bin/env bash
# Compiles the CV to public/swadhin-biswas-cv.pdf (served at /swadhin-biswas-cv.pdf).
# Usage: bash scripts/build-cv.sh
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p cv/out
pdflatex -interaction=nonstopmode -halt-on-error -output-directory=cv/out cv/swadhin-biswas-cv.tex >/dev/null
pdflatex -interaction=nonstopmode -halt-on-error -output-directory=cv/out cv/swadhin-biswas-cv.tex >/dev/null
cp cv/out/swadhin-biswas-cv.pdf public/swadhin-biswas-cv.pdf
echo "wrote public/swadhin-biswas-cv.pdf"
