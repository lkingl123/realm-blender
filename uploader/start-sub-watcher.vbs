Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "node """ & Replace(WScript.ScriptFullName, "start-sub-watcher.vbs", "sub-watcher.js") & """", 0, False
