# Online-Kochbuch_V2
Eine einfache grundlegende Website über Rezepte.

Für diese Webapp ist es eine MySQL Datenbank lokal installiert zu haben. 
Für die Entwicklung der Webapp wurde VS Code verwendet. 
Wichtige Vorkehrungen bevor man das Programm startet:
Wenn man den Source Code herunterlädt ist es wichtig in den Ordner Online-Kochbuch_V2 eine env Datei zu erstellen bevor man die Seite aufruft. Dort müssen die Environment Variablen für das Programm erstellt werden, welche sensible Daten beinhalten.
Für dieses Programm müssen in die .env Datei folgende Variablen:

DB_PASS = 'dein Passwort für den Zugang zur Datenbank'

EMAIL_HOST = 'die Email Adresse für den Account von welchem die Emails gesendet werden für die Token bzw. um das Passwort für den jeweiligen Benutzer zurückzusetzen' -> also die Email Adresse von der 'Website' als Host.

EMAIL_PASS = ' Das Passwort für den Zugang zu der Email Adresse von der 'Website' als Host.

Vor den Start des Programms:

Im Verzeichnis, welches das Online-Kochbuch_V2 als Endpunkt definiert ist, muss im Terminal bzw. CMD (nicht PoweShell !!!) der Befehl 'npm install' durchgeführt werden.
Durch diesen Befehl werden alle Dependencies heruntergeladen.
Danach kann man die Website unter 'http://localhost:3000/' aufrufen und für seine Zwecke verwenden.
