// externe Module
const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const nodeMailer = require('nodemailer');
require('dotenv').config();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

/** 
 * mysqlStore wichtig für die Speicherung der Sessions in der Konstruktor Funktion MySQLStore 
 * kann alternativ eine eigene Tabelle für die Sessions erstellt werden.
 * Ansonsten wird eine Tabelle automatisch von express-mysql-session erstellt, Beispiel:
 *@example
const options = {
	// Host name for database connection:
	host: 'localhost',
	// Port number for database connection:
	port: 3306,
	// Database user:
	user: 'session_test',
	// Password for the above database user:
	password: 'password',
	// Database name:
	database: 'session_test',
	// Whether or not to automatically check for and clear expired sessions:
	clearExpired: true,
	// How frequently expired sessions will be cleared; milliseconds:
	checkExpirationInterval: 900000,
	// The maximum age of a valid session; milliseconds:
	expiration: 86400000,
	// Whether or not to create the sessions database table, if one does not already exist:
	createDatabaseTable: true,
	// Whether or not to end the database connection when the store is closed.
	// The default value of this option depends on whether or not a connection was passed to the constructor.
	// If a connection object is passed to the constructor, the default value for this option is false.
	endConnectionOnClose: true,
	// Whether or not to disable touch:
	disableTouch: false,
	charset: 'utf8mb4_bin',
	schema: {
		tableName: 'sessions',
		columnNames: {
			session_id: 'session_id',
			expires: 'expires',
			data: 'data'
		}
	}
};
const sessionStore = new MySQLStore(options);
 */
const mysqlStore = require('express-mysql-session');

// internes Node.js Modul
const path = require('path');

// eigene Module
const {db} = require('./scripts/database')
const {initDatabase} = require('./scripts/database');

async function startInitDb() {
try {

    await initDatabase();
} catch(error) {
    console.error('Fehler beim Starten der Anwendung:', error);
}
}


/**
 * Diese Funktion ist wichtig um die Kommentare in eine geeignete Struktur für die Kommentare und Subkommentare zu erzeugen bzw. für eine verschachtelte Struktur 
 * Aus der Selbstreferenzierenden Kommentar Tabelle ist parent-id die Kommentar-id von dem vorigen Kommentar, dadurch hat man einen Bezugspunkt in der Tabelle
 * Die Funktion kommentarStruktur 
 * @param {array} kommentare - Ein Array von Objekten als Parameter für unsere Funktion
 * @returns {array} Gibt ein Array von Objekten zurück die mit Unterkommentaren verschachtelt sind
 * 
 */
function kommentarStruktur(kommentare) {

    ergebnis = [];
    kommentarModel = {};

    kommentare.forEach(kommentar => {
        kommentar.subKommentar = [];
        kommentarModel[kommentar.id_Kommentar] = kommentar;

        if(kommentar.id_parent === null) {
            ergebnis.push(kommentar);
        }
    })

    kommentare.forEach(kommentar => {
        if(kommentar.id_parent !== null) {
           const parentKomment = kommentarModel[kommentar.id_parent];
           if(parentKomment) {

            parentKomment.subKommentar.push(kommentar)
           }
        }
    })

    return ergebnis;
}
const MySQLStore = mysqlStore(session);

/**
 * sessionStore ist ein Objekt welches so konfiguriert ist, dass es den Speicherort der Sessions angibt
 * Speicherort ist unsere MySQL Datenbank
 * Mehr infos siehe: 
 * {@link https://www.npmjs.com/package/express-mysql-session}
 */
const sessionStore = new MySQLStore({
    host:'localhost',
    port:'3306',
    user:'root',
    database: 'kochbuch_neu',
    password: process.env.DB_PASS
    /*,
    createDatabaseTable: true,

    schema: {
        tableName:'Benutzer-Sessions',
        columnNames: {
            session_id:'user_id',
            expires:'hours',
            data:'email'

        }
    }
        */

})

// Für das Speichern der Bilder 
const storageConfig = multer.diskStorage( {
    destination: function(req, file, cp) {
        cp(null, 'bilder_gerichte');
    },

    filename: function(req, file, cp) {
        cp(null, Date.now() + '-' + file.originalname)
    }
})

// Rate Limit konfigurieren
const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 min
    max: 3, // max. 3 Anfragen pro 15min
    message: 'Zu viele Anfragen von dieser IP Adresse gesendet, versuche es in 15 min wieder.'
})



const app = express();

// Initialisierung der Tabellen bei der ersten Verwendung des Programs
startInitDb(); // enthalten in /scripts/database

/**
 * 
 * multer besitzt jetzt die SpeicherKonfigurationen, und ist eingestellt wo die Bilder gespeichert werden im Filesystem und wie die files bezeichnet werden
 * zusätzlich haben wir auch dadurch die Information unter welchem Pfad die Bilder gespeichert werden.
 * upload wird als Middleware für den request.file verwendet. upload
 */
const upload = multer({storage: storageConfig})

// Middlewares
app.use(express.static('styles'));
app.use(express.static('images'));
app.use(express.static('scripts'))
app.use(express.urlencoded({extended:false}));

// Session Middleware
/**
 * 
 */
app.use(session({
    secret:'sicherer-Schlüssel',
    resave: false,
    saveUninitialized: false,  // wenn true dann wird bei jedem request ein leeres session erstellt. 
    store: sessionStore

}));

/**
 *  Für das speichern von den Bildern der Gerichte '/bilder_gerichte' ist ein Filter, weil der Pfad beim hochladen durch die storageConfig in der Datenbank gespeichert wird und
 * sonst die Bilder unter einem falschen Pfad sucht
 */
app.use('/bilder_gerichte',express.static('bilder_gerichte'))

// Middleware für gesendete JSON Datenformate aus API Anfragen, wird benötigt für die Decodierung,
// Formularanfragen werden traditionellerweise als url-encoded oder multipart/form-data bei file uploads
app.use(express.json());


// Middleware für die Verwendung von einer eher älteren template engine -> 'ejs'
app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))


//##########################################################################################################################
// Und hier beginnen alle Routen

// Durch diesen Request wird eine Start Seite gerendert, wo man eine Liste von Gerichten mit Bildern sieht (gerichte.ejs)
app.get('/', async (request, response) => {

    const [rezept] = await db.query('SELECT * FROM kochbuch_neu.rezept');
 
    response.render('gerichte', {countRezept: rezept.length, allRezepts: rezept});
})

// Durch den home request wird die index Seite gerendert, wo man Rezept mit einem Suchfilter finden kann (diese Seite ist nur mithilfe cookie-sessions für eingeloggte  User sichtbar)
app.get('/home', (request, response) => {

    if(!request.session.isAuthenticated) {
        return response.status(401).render('401',{message: 'Sie sind nicht authorisiert, bitte loggen Sie sich ein'});
    }
    response.render('index')
})

// Registrierung
app.get('/registration', (request, response) => {
   
    let errorMessageRegistration =  request.session.errorMessage;

    if (!errorMessageRegistration) {
        errorMessageRegistration = {
            nachricht: '',
            benutzer: '',
            email: '',
            confirm_email: '',
    
        }  
      
    }

    request.session.errorMessage = null

    response.render('registration',{ message: errorMessageRegistration})
})

// Die Registrierung wird durchgeführt, validiert, mittels sessions wird ein Fehler angezeigt ob der User bereits existiert oder es ein anderes Problem gibt
app.post("/registrierung-save-data", async(request,response) => {
    
    
    const registrationData = request.body;
    const formatedData = {
        benutzer: registrationData.benutzer,
        email:registrationData.email,
        confirm_email: registrationData['confirm-email'],
        password:registrationData.password
    }
    
        if(!formatedData.email || !formatedData.confirm_email || !formatedData.password || formatedData.email !== formatedData.confirm_email || formatedData.password.trim().length < 4 || !formatedData.email.includes('@')) {
    
        // Benachrichtigung für die fehlegeschlagene Registrierung  mit Sessions anzeigen
        
       let registrierungFehlgeschlagen = {

            nachricht: ' Bei der Registrierung ist was schiefgelaufen, noch einmal registrieren',  
            benutzer: formatedData.benutzer,
            email: formatedData.email,
            confirm_email: formatedData.confirm_email,
    
        }
   
        request.session.errorMessage = registrierungFehlgeschlagen;
    
    
        return response.redirect('/registration');

        }
    // Das eingegebene Passwort hashen
        const hashedPassword = await bcrypt.hash(formatedData.password, 12);
    // Datenbankanfrage für die Überprüfung des Users, falls vorhanden
        const [existingUser] = await db.query('SELECT * FROM registrierung WHERE email = ?',[formatedData.email]);
    
    
        if(existingUser.length !== 0){
    
            if(existingUser[0].email === formatedData.email) {
    
               let registrierungFehlgeschlagen = {
                    nachricht: 'User existiert bereits',
                    benutzer: formatedData.benutzer,
                    email: formatedData.email,
                    confirm_email: formatedData.confirm_email,
            
                }
    
                request.session.errorMessage = registrierungFehlgeschlagen;
                
                console.log('User mit der Email-Adresse existiert bereits')
                return response.redirect('/registration');
            }   
        }
    
    // Noch überprüfen wie man das ganze Objekt in die SQL abfrage eingibt

   const metaDataForCreatingAdmin = await db.query('INSERT INTO kochbuch_neu.registrierung (benutzer,email,confirm_email,passwort) VALUES (?,?,?,?)',[formatedData.benutzer,formatedData.email,formatedData.confirm_email,hashedPassword]);
   console.log(metaDataForCreatingAdmin[0].insertId)
   const [adminExists] = await db.query('SELECT * FROM kochbuch_neu.registrierung WHERE is_Admin = 1');
   
   // Falls kein Afmin noch vorhanden ist wird registrierte User zum Admin indem is_Admin auf true bzw. für MySQL auf 1 gesetzt. Das erfolgt beim ersten registrierten User.
   if (adminExists.length === 0) {
    await db.query('UPDATE kochbuch_neu.registrierung SET is_Admin = 1 WHERE id_registrierung = ?',[metaDataForCreatingAdmin[0].insertId]);
    };
    response.redirect('/login');
})
    

//Login
app.get("/login", (request, response) => {
    let error = request.session.error;

    if(!error) {
        error = null
    }

    request.session.error = null;
    return response.render('login', {message: error})

});

// Login Anfrage wird hier validiert
app.post('/login',async (request,response) => {
      
    const loginData = request.body;
    userEmail = loginData.email;
    userPassword = loginData.password;


    const [userData] = await db.query('SELECT * FROM kochbuch_neu.registrierung WHERE email = ?', [userEmail])

    if(userData.length === 0) {
        request.session.error = 'Etwas ist schiefgelaufen'; 

       return response.redirect("/login");
    }

    // Passwort wird gehasht und mit dem gehashten Passwort aus der Datenbank verglichen
     const paswordsAreEqual = await bcrypt.compare(userPassword, userData[0].passwort)

      if(!paswordsAreEqual) {
    
        request.session.error = 'Etwas ist schiefgelaufen'; 
        return response.redirect('/login');
      }
       
        request.session.user = {name: userData[0].benutzer, email: userData[0].email, id: userData[0].id_registrierung}
        request.session.isAuthenticated = true;

        // Aus der Datenbank wird abgefragt ob der User auch ein Admin ist
        request.session.isAdmin = userData[0].is_Admin;

        request.session.save( function () {
            
            return response.redirect('/home')    
        })

})

// alle Sessions werden beim Logout null bzw. authentifizierung auf false gesetzt; isAdmin könnte auch auf null statt false gesetzt werden
app.get('/logout', (request,response) => {

    request.session.user = null;

    request.session.isAuthenticated = false;
    request.session.isAdmin = false;
    response.redirect('/')
})


//#########################################################################################################################################

app.get('/detailiertes-gericht/:id', async (request, response) => {
   
    let isAdmin = request.session.isAdmin;
    let isAuthenticated = request.session.isAuthenticated
    const idRezept = request.params.id;

    try {
    // Abfrage des Rezepts mit den zugehörigen Kommentaren und Benutzern
    const [onlyRezept] = await db.query('SELECT * FROM kochbuch_neu.rezept LEFT JOIN kochbuch_neu.kommentar ON rezept.id_Rezept = kommentar.kommentar_id_Rezept LEFT JOIN kochbuch_neu.registrierung ON kochbuch_neu.registrierung.id_registrierung = kochbuch_neu.kommentar.registrierung_id_user WHERE rezept.id_Rezept = ?',[idRezept])
    // Abfrage des Rezepts mit den zugehörigen Zutaten
    const [zutaten] = await db.query('SELECT * FROM kochbuch_neu.zutaten WHERE kochbuch_neu.zutaten.Zutat_id_Rezept = ?',[idRezept])
    // Abfrage der zugehörigen Kommentaren und Benutzern 
    // Info: statt dieser Abfrage könnte man onlyRezept auch verwenden, zur Veranschaulichung von mehreren möglichen Lösungen wurde aber darauf verzichtet
    const [comment] = await db.query('SELECT * FROM kochbuch_neu.kommentar LEFT JOIN registrierung ON kommentar.registrierung_id_user = registrierung.id_registrierung WHERE kommentar.kommentar_id_Rezept  = ?',[idRezept]);
  
    const strukturierteKommentare = kommentarStruktur(comment);
//console.log(strukturierteKommentare[0].Datum.toISOString().split('T')[0]);

    if(onlyRezept[0] !== undefined) {
        return response.render('detailiertes', {idRezept:idRezept, onlyRezept: onlyRezept, zutaten: zutaten, comment: strukturierteKommentare, isAdmin: isAdmin, isAuthenticated: isAuthenticated});
    }
    } catch(error) {
    console.log('Fehler in Route /detailiertes-gericht/:id ' + error);
}

response.status(404).render('404');
})


app.post('/neues-rezept', upload.single('image-speise'), async (request,response) => {
    const data = request.body;
    let uploadImageSpeise = request.file;
    if(uploadImageSpeise === undefined) {
        uploadImageSpeise = '';
    }
    
    const [data_id_Rezept] = await db.query('INSERT INTO rezept (Name,Beschreibung,Dauer,Pfad_Bild) VALUES (?,?,?,?)',[data.rezeptname,data.rezeptbeschreibung,data.dauer, uploadImageSpeise.path]);
    console.log(data_id_Rezept)
    response.redirect('/admin');
})

app.post("/zutaten-zum-rezept/:id", (request,response) => {

    const zutat = request.body.zutat;
    const rezeptId = request.params.id

    db.query('INSERT INTO zutaten (Zutaten, zutaten.Zutat_id_Rezept) VALUES (?,?    )',[zutat,rezeptId])
    response.redirect('/admin')
})

app.get('/meine-gerichte', async (request,response) => {

    try {
        const [rezept] = await db.query('SELECT * FROM kochbuch_neu.rezept');
    
        /* Darauf wurde verzichtet
         for (const r of rezept) {
            if(r.Pfad_Bild) {
             r.Pfad_Bild = r.Pfad_Bild.replace('bilder_gerichte\\', '')
             console.log(r)
         }}
       */
        
        response.render('gerichte', {countRezept: rezept.length, allRezepts: rezept});

    } catch(error) {
        console.log(error)
    }
})


app.post('/rezept-suche', async (request, response) => {
    const rezept = request.body.name;

    if(rezept) {

        const [rezeptDb] = await db.query('SELECT * FROM rezept WHERE Name LIKE ?', [`%${rezept}%`]);
        return response.json(rezeptDb);
    }
    const [rezeptDb] = await db.query('SELECT * FROM rezept');

    response.json(rezeptDb);
})

// Für eine neue Seite Suchfilter mit Namen des Rezepts

app.get('/selectedRezepts', async (request,response) => {
    const name = request.query.name;

   const [rezepts] = await db.query('SELECT * FROM rezept WHERE Name LIKE ? ',[`${name}`]);
   console.log(rezepts)
   response.render('rezepteGefiltert', {names: rezepts});
})


app.post('/rezept-ausgewaehlt', async (request, response) => {
    const rezept = request.body;
    
    const [rezeptDb] = await db.query('SELECT * FROM rezept LEFT JOIN zutaten ON rezept.id_Rezept = zutaten.Zutat_id_Rezept WHERE rezept.id_Rezept = ?', [rezept.rezept_id])
 
    
    response.json(rezeptDb)
    
})


app.post("/rezept-loeschen", async (request, response)=> {
    const data = request.body;
    console.log(data)
    await db.query('DELETE FROM rezept WHERE id_Rezept = ?',[data.id])
})


app.post('/rezept-bearbeiten', async (request,response) => {
const updateData = request.body;
const preparedData = {
    name: updateData.name,
    beschreibung: updateData.beschreibung,
    id: updateData.id,
    alleZutaten: updateData.zutaten
}
console.log(updateData)
await db.query('UPDATE rezept SET Name = ?, Beschreibung = ?  WHERE id_Rezept = ?',[preparedData.name,preparedData.beschreibung,preparedData.id]);

if(preparedData.alleZutaten !== null) {

    
    for(zutat of preparedData.alleZutaten) {
      
        await  db.query('Update zutaten SET ZUTATEN = ? WHERE id_zutaten= ?',[zutat.name,zutat.id])
    }
}
response.send('Erfolgreich')
})


app.get('/admin', async (request,response) => {

    if(!request.session.isAdmin) {
        return response.status(401).render('401', {message: 'Sie sind kein Admin'});
    }
    
    
        const [neuesRezept] = await db.query('SELECT * FROM kochbuch_neu.rezept ORDER BY  id_Rezept DESC  Limit 1')

   
    
        request.session.save( function() {
            return response.render('admin', {neuesRezept: neuesRezept})

        })
    
})

//####### Kommentare
// Hier wird das erste Kommentar zum Rezept initiert, welches kein parentId hat
// Die Kommentare werden in MySQL als eine selbstreferenzierende Tabelle gespeichert
app.post("/post_comment", (request,response) => {
const data = request.body;

const userId = request.session.user.id;
db.query('INSERT INTO kochbuch_neu.kommentar (Kommentar, registrierung_id_user,kommentar_id_Rezept) VALUES (?,?,?)',[data.comment, userId, data.idRezept])
response.redirect(`/detailiertes-gericht/${data.idRezept}`)
});

// Die Antworten zu den Kommentaren werden in der selben Kommentar Tabelle gespeichert mit einer parentId, welche auf das Kommentar bzw. Antwort sich diese Antwort bezieht
// Man kann eine Antwort auf ein neues Kommentar, auf eine bestehende Antwort oder auf seine eigene Antwort. 
// Im Frontend ('detailiertes.ejs'), welches durch den redirect zum Browser eine Anfrage gesendet wird und der Browser dadurch eine zweite Anfrage an die get Route für "/detailiertes-gericht"
// mit den Route Parameter ":id"; siehe unteren Kommentar
// -> app.get('/detailiertes-gericht/:id'
app.post("/post_answer", async (request,response) => {
    
    const answer = request.body;
    const userId = request.session.user.id;
 
    await db.query('INSERT INTO kochbuch_neu.kommentar (Kommentar, registrierung_id_user,kommentar_id_Rezept,id_parent) VALUES (?,?,?,?)',[answer.answer,userId,answer.idRezept, answer.parentId]);
    response.redirect(`/detailiertes-gericht/${answer.idRezept}`)
 })


app.post('/delete-comment-admin/:id', (request,response) => {
    const rezeptId = request.params.id;
    db.query('DELETE FROM kochbuch_neu.kommentar WHERE kochbuch_neu.kommentar.kommentar_id_Rezept = ?',[rezeptId]);
    response.redirect(`/detailiertes-gericht/${rezeptId}`)
});

// Passwort zurücksetzung

app.get('/forgot-password', (request, response) => {

    // hier für die Passwort zurücksetzung HTML Formular entwickeln mit Email eingabe und und Link für HTML Seite für Passwort wiedergabe
    response.render('requestToken');
})

// Rate Limiter als Middleware wird hier verwendet bei der Route der Email Anfrage
app.post("/no-password", resetPasswordLimiter, async (request,response) => {

    const email = request.body.email;
   
    // Token Signature Generierung für die Passwort Zurücksetzung. Mit einer Email wird der Link versendet, hierfür wird das Modul Nodemailer verwendet

    const token = crypto.randomBytes(15).toString('hex');

    const currentTime = new Date();
    currentTime.setMinutes(currentTime.getMinutes() + 10);
    const mysqlTime = currentTime.toLocaleString('sv-SE', { timeZone: 'Europe/Vienna' }).replace('T', ' ');
    
    const [user] = await db.query('SELECT email FROM registrierung WHERE email = ?',[email] );
    
    if(user.length === 0) {
       return response.status(500).render('500')
    }

   const [data] = await db.query('Update registrierung SET resetPasswortToken = ?, resetPasswortExpires = ? WHERE email = ?',[token, mysqlTime, email] )
    

    // Email-Transporter erstellen
let transporter = nodeMailer.createTransport({
    host: 'mail.gmx.net',
    port: 465,  //SSL Port
    secure: true, //SSL aktiv
    auth: {
        user: process.env.EMAIL_HOST,
        pass: process.env.EMAIL_PASS
    },
    tls:{
        rejectUnauthorized:false,
    }
});


const mailOptions = {
    from: process.env.EMAIL_HOST,
    to: email,
    subject: 'Passwort zurücksetzen',
    text: `Du hast diese Email erhalten weil du (oder jemand anderer) das Passwort für den Zugang zu deinem Account in "Das kleine Kochbuch" zurücksetzen möchte.
    Bitte klicke auf den Link um das Passwort zurückzusetzen oder copy und paste es in deinen Browser um zur Seite für eine neue Passwortsetzung zu gelangen
    und den Prozess zu beenden. Link: \n\n http://localhost:3000/reset/${token} \n\n
    Wenn du diese Anfrage nicht gestellt hast, dann ignoriere bitte diese Email-Nachricht und klicke nicht auf den Link. Dieser Link läuft in 10 min ab.`
    
};

    transporter.sendMail(mailOptions,(error, info) => {
        console.log(error)
        console.log(info)
    })

    response.render('emailRequest')
})

app.get('/reset/:token', (request, response) => {

    let token = request.params.token;
    let wrongPassword = request.session.password;

    if(!wrongPassword) {
        wrongPassword = {
            message: ''
        }
    }

    request.session.password = null;
    response.render('neuesPasswort', {message: wrongPassword, token: token})
});


// Rate Limiting implementieren
app.post('/reset/:token', async (request, response) => {
    const token = request.params.token;
    const passwords = request.body;
    console.log(token)

    if(passwords.passwort !== passwords['Passwort-wiederholen']) {

        request.session.password = {
            message: 'Passwörter stimmen nicht überein'
            
        }
        return response.redirect(`/reset/${token}`);
    }

   const [passwordExpire] = await db.query('SELECT resetPasswortExpires FROM registrierung WHERE resetPasswortToken = ?',[token])

  const dateFromMySQL = new Date(passwordExpire[0].resetPasswortExpires);
  const currentDate = new Date();
  
  if (dateFromMySQL.getTime() > currentDate.getTime() ) {

    
    const hashedPassword = await bcrypt.hash(passwords.passwort, 12) 
    
    try {
        
        await db.query('UPDATE registrierung SET passwort = ?, resetPasswortToken = NULL, resetPasswortExpires = NULL WHERE resetPasswortToken = ?', [hashedPassword, token]);
        
    } catch (error) {
        console.error('Fehler beim Zurücksetzen des Passworts:', error);
    }
    
    return response.redirect('/home');
}

else if (dateFromMySQL.getTime() < currentDate.getTime()) {

    request.session.password = {
        message: 'DIe Zeit ist abgelaufen, bitte eine neue Email anfragen'
        
    }
    try {
        
        await db.query('UPDATE registrierung SET resetPasswortToken = NULL, resetPasswortExpires = NULL WHERE resetPasswortToken = ?', [token]);
        
    } catch (error) {
        console.error('Fehler beim Zurücksetzen des Passworts:', error);
    }
}


response.redirect(`/reset/${token}`);
});
/*
// Falsche Eingaben im Pfad
app.use( function( request, response) {
    response.status(404).render('404');
});
*/
// Server Probleme
app.use( function(error, request, response, next) {
    response.status(500).render('500')
});

app.listen(3000, () => {
    console.log('Web-Server horcht auf Port 3000')})