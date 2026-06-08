' restart-sub-watcher.vbs — kills any running sub-watcher and launches a fresh one,
' silent (no terminal window). Drop a shortcut to this on the Desktop for one-click
' restart. Created May 28, 2026.

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Absolute path to sub-watcher.js (built from this script's location)
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName) & "\sub-watcher.js"

' Kill any node.exe whose CommandLine includes "sub-watcher" (precise; spares other node processes)
killCmd = "powershell -NoProfile -Command ""Get-CimInstance Win32_Process -Filter 'Name=''node.exe''' | Where-Object { $_.CommandLine -match 'sub-watcher' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"""
WshShell.Run killCmd, 0, True   ' 0 = hidden window, True = wait for finish

' Brief pause so the OS releases the port/handle
WScript.Sleep 1500

' Launch a fresh sub-watcher, headless (0 = no window)
WshShell.Run "node """ & scriptPath & """", 0, False
