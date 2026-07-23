#!/bin/bash
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is not installed."
  echo "Install Python 3 first, then run this file again."
  exit 1
fi

echo "Python found:"
python3 --version
echo ""
echo "Starting local server on http://127.0.0.1:8000/test.html"
python3 -m http.server 8000
