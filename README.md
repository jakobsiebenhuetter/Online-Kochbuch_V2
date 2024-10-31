# Online-Kochbuch_V2
Eine einfache grundlegende Website über Rezepte.

Diese Webapp wurde mit Vanilla JS im Frontend und mit Node.js als Backend programmiert. Für die Speicherung der Daten wurde eine MySQL Datenbank verwendet, daher 
ist es wichtig MySQL lokal installiert zu haben, damit das Programm funktionieren kann.

Für die Entwicklung der Webapp wurde VS Code verwendet. 
Wichtige Vorkehrungen bevor man das Programm startet:
Wenn man den Source Code herunterlädt ist es wichtig in den Ordner Online-Kochbuch_V2 eine env Datei zu erstellen bevor man die Seite aufruft. Dort müssen die Environment Variablen für das Programm erstellt werden, welche sensible Daten beinhalten.
Für dieses Programm müssen in die .env Datei folgende Variablen:

DB_PASS = 'dein Passwort für den Zugang zur Datenbank'

EMAIL_HOST = 'die Email Adresse für den Account von welchem die Emails gesendet werden für die Token bzw. um das Passwort für den jeweiligen Benutzer zurückzusetzen' -> also die Email Adresse von der 'Website' als Host.
Es sollte ein gmx Account verwendet werden, da dieses Programm für diesen Email Provider konfiguriert ist.

EMAIL_PASS = ' Das Passwort für den Zugang zu der Email Adresse von der 'Website' als Host.

Vor dem Start des Programms:

Im Verzeichnis, welches das Online-Kochbuch_V2 als Endpunkt definiert ist, muss im Terminal bzw. CMD (nicht PowerShell !!!) der Befehl 'npm install' durchgeführt werden.
Durch diesen Befehl werden alle Dependencies heruntergeladen.
Danach kann man die Website unter 'http://localhost:3000/' aufrufen und für seine Zwecke verwenden.

Wichtige information:

Alle Tabellen, welche für diese Website benötigt werden, werden beim start des Programms automatisch erstellt, falls diese in MySQL nicht vorhanden sein sollten.
Der erste Benutzer, der sich registriert wird automatisch zum Admin der Website. Danach kann man nur manuell in der Datenbank zusätzliche Admins deklarieren.
Der Admin kann Rezepte erstellen, löschen und bearbeiten. Er kann auch alle Kommentare löschen.



