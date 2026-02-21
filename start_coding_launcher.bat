@echo off
echo Preparing SkillForge Coding Domain (Server + App)...
cd coding\server
call npm install
echo Starting server...
node index.js
pause
