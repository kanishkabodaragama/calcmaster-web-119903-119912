#!/bin/bash
cd /home/kavia/workspace/code-generation/calcmaster-web-119903-119912/frontend_app
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

