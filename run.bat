@echo off
echo ==========================================================
echo  CampusNet Monitor - Campus Congestion & Traffic Control
echo  Course Based Project (CBP) - B.Tech Computer Networks
echo ==========================================================
echo.
echo Installing requirements...
python -m pip install -r requirements.txt --quiet
echo.
echo Launching CampusNet Server on http://127.0.0.1:5000 ...
start http://127.0.0.1:5000
python backend\app.py
pause
