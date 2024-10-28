const mySql = require('mysql2/promise');
require('dotenv').config();

// MySQL connection erstellen
const db = mySql.createPool({
    host:'localhost',
    user:'root',
 // database:'kochbuch',
    password: process.env.DB_PASS
})



module.exports = {
    db: db,
    initDatabase: initDatabase
};



async function initDatabase() {

    let connection;

try {
    connection = await db.getConnection();

   // Datenbank wird als kochbuch_neu erstellt, falls Sie nicht existiert
   await connection.query('CREATE DATABASE IF NOT EXISTS kochbuch_neu')

   // Datenbank wird verwendet 
   await connection.query('USE kochbuch_neu')

   // Transaction beginnen
   await connection.beginTransaction();

   // Registrierungstabelle
   await connection.query(`
        CREATE TABLE IF NOT EXISTS registrierung (
        id_registrierung int NOT NULL AUTO_INCREMENT,
        benutzer varchar(1000) NOT NULL,
        email varchar(100) NOT NULL,
        confirm_email varchar(100) NOT NULL,
        passwort varchar(10000) NOT NULL,
        is_Admin tinyint DEFAULT NULL,
        resetPasswortToken varchar(255) DEFAULT NULL,
        resetPasswortExpires datetime DEFAULT NULL,
        PRIMARY KEY (id_registrierung)
      ) 
    `);
    

// Rezept Tabelle
    await connection.query(`
    CREATE TABLE IF NOT EXISTS rezept (
    id_Rezept int NOT NULL AUTO_INCREMENT,
    Name varchar(45) NOT NULL,
    Beschreibung varchar(10000) NOT NULL,
    Dauer varchar(45) DEFAULT NULL,
    Pfad_Bild varchar(1000) DEFAULT NULL,
    PRIMARY KEY (id_Rezept)
    ) `
    )  

    // Zutaten Tabelle
    await connection.query(`
    CREATE TABLE IF NOT EXISTS zutaten (
    id_zutaten int NOT NULL AUTO_INCREMENT,
    Zutaten varchar(1000) NOT NULL,
    Zutat_id_Rezept int NOT NULL,
    PRIMARY KEY (id_zutaten),
    CONSTRAINT fk_zutat_rezept FOREIGN KEY (Zutat_id_Rezept) REFERENCES rezept(id_Rezept) ON DELETE CASCADE
    )`
)

// Kommentar Tabelle
await connection.query(`
    CREATE TABLE IF NOT EXISTS kommentar (
    id_Kommentar int NOT NULL AUTO_INCREMENT,
    Kommentar varchar(10000) NOT NULL,
    registrierung_id_user int NOT NULL,
    kommentar_id_Rezept int NOT NULL,
    Datum datetime DEFAULT CURRENT_TIMESTAMP,
    id_parent int DEFAULT NULL,
    PRIMARY KEY (id_Kommentar),
    CONSTRAINT fk_kommentar_rezept FOREIGN KEY (kommentar_id_Rezept) REFERENCES rezept(id_Rezept) ON DELETE CASCADE,
    CONSTRAINT fk_kommentar_user FOREIGN KEY (registrierung_id_user) REFERENCES registrierung(id_registrierung) ON DELETE CASCADE,
    CONSTRAINT fk_kommentar_parent FOREIGN KEY (id_parent) REFERENCES kommentar(id_Kommentar) ON DELETE CASCADE
  )`
)
    // Tabelle mit Sessions fehlt, diese wird automatisch erstellt


await connection.commit();
console.log('Datenbank kochbuch_neu erfolgreich initialisiert')
    } catch (error) {

        console.log('Fehler beim initialisieren der Datenbank' + error)
        if(connection) {
            await connection.rollback();
        }

    } finally {
        if(connection) {
            connection.release()
        }
    }

    }
