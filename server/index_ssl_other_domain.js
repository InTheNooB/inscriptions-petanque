// ***** IMPORTS ***** // 
const yaml = require('js-yaml');
const cookieParser = require("cookie-parser");
const fs = require("fs");
const express = require("express");
const app = express();
const cors = require("cors");
const https = require("https");
const sessions = require('express-session');
const nodemailer = require("nodemailer");
const PORT = process.env.PORT || 3001;

// ***** SESSION ***** // 
// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;



https.createServer(
  {
    key: fs.readFileSync("./privkey.pem"),
    cert: fs.readFileSync("./cert.pem"),
    ca: fs.readFileSync("./chain.pem"),
    requestCert: false,
    rejectUnauthorized: false,
  },
  app
).listen(PORT);


//session middleware
app.use(sessions({
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
  saveUninitialized: true,
  cookie: { maxAge: oneDay, secure: true, sameSite: "none", httpOnly: false },
  resave: false
}));

// ***** EXPRESS ***** //
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "https://petanque.jeunesse-1566.ch",
  credentials: true,
}))


// ***** CONST ***** //
const PATHS = {
  TEAMS: './server/teams.yml',
  TOURNAMENT: './server/tournament.yml',
  CONFIG: './server/config.yml'
}


// ***** VARS ***** //
let mailjet;
let config = {};
let session;

loadConfig();
// ***** ENDPOINTS ***** //
/**
 * GET API endpoint to test if the API is up and running.
 * 
 * @return {json}    {result : "OK", apiStatus: "Running...", logged: true | false}
 */
app.get("/api/check", (req, res) => {
  session = req.session;
  res.json({ result: "OK", apiStatus: "Running...", logged: session.isLogged });
});

/**
 * GET API endpoint to get information about the upcoming tournament.
 * The information are retreived from the "tournament.yml" file. 
 * 
 * @return {json}    {result : "OK", tournamentInformation: {}}
 */
app.get("/api/getTournamentInformation", (req, res) => {
  res.json({ result: "OK", tournamentInformation: getTournamentInformation() });
});

/**
 * GET API endpoint to get the list of registered teams.
 * The information are retrieved from the "teams.yml" file. 
 * 
 * The user must be logged in to use this endpoint.
 * 
 * @return {json}    {result : "KO", isLogged: false}
 *                || {result : "KO"}  
 *                || {result : "OK", teams: []}  
 */
app.get("/api/getTeams", (req, res) => {
  session = req.session;
  // If the user is logged, return the teams, otherwise return an error.
  if (session.isLogged) {
    let teams = getTeams();
    if (teams != null) {
      // If the teams were retreived successfully
      res.json({ result: "OK", teams: teams })
    } else {
      res.json({ result: "KO" })
    }
  } else {
    res.json({ result: "KO", isLogged: false })
  }
});


/**
 * POST API endpoint to log in.
 * @param {string} username - The user's username 
 * @param {string} password - The user's password
 * 
 * @return {json} {result : "KO" | "OK"}
 * 
 * The user must be logged in to use this endpoint.
 */
app.post("/api/login", (req, res) => {
  session = req.session;
  new Promise(resolve => {
    // If the user is already logged, just return "OK"
    if (session.isLogged) {
      resolve(true);
    }
    // If both parameters were passed
    if (req.body.username && req.body.password) {
      // If the credentials are corrects
      if (req.body.username === config.ADMIN.USERNAME && req.body.password === config.ADMIN.PASSWORD) {
        resolve(true);
      } else {
        resolve(false)
      }
    }
  }).then((logged) => {
    if (logged) {
      // Logged successfully
      session.isLogged = true;
      res.json({ result: "OK" });
    } else {
      // Could not log
      res.json({ result: "KO" });
    }
  });
});

/**
 * POST API endpoint to register a new unvalidated team in the list (teams.yml).
 * 
 * @param {json} { 
 *                  teamName: string,
 *                   captain: {
 *                       name: string,
 *                       email: string,
 *                       phone: string
 *                   }
 *               }
 * @returns {json} { result: "OK" | "KO"}
 */
app.post("/api/registerTeam", (req, res) => {
  // Get the list of team
  let teams = getTeams() ?? [];

  // Look for the current highest ID and set the new one by adding one.
  let highestId = teams.reduce((prev, curr) => { return curr.id > prev ? curr.id : prev }, 0) + 1;

  // Create the new team object
  let newTeam = {
    ...req.body,
    id: highestId,
    validated: false,
    paiementStatus: 0,
    registrationDate: getCurrentDateTime(),
  };

  delete newTeam.sendEmail;

  // Add the new team to the list
  teams.push(newTeam);

  try {
    // Writes the list back into the file
    fs.writeFileSync(PATHS.TEAMS, yaml.dump(teams), 'utf8');
    if (req.body.sendEmail) {
      sendRegistrationConfirmationEmail(newTeam);
    }
    res.json({ result: "OK" })
  } catch (error) {
    res.json({ result: "KO" })
  }
});



/**
 * POST API endpoint to validate a team (change their "validated" attribute to 1).
 * 
 * The user must be logged in to use this endpoint.
 * 
 * @param {number} teamId - The ID of the team to validate
 * @returns {json} { result: "OK" , teams: [] } || { result: "KO"}
 */
app.post("/api/validateTeam", (req, res) => {
  let team = null;

  new Promise((resolve) => {
    session = req.session;

    // If the user is not logged, return an error
    if (!session.isLogged) {
      resolve({ result: false });
    }

    let teamId = req.body.teamId;
    // If the parameter teamId was not passed, return an error
    if (!teamId) {
      resolve({ result: false });
    }

    let teams = getTeams();
    // If an error occured while getting the list of team, return an error
    if (teams == null) {
      resolve({ result: false });
    }

    // If nothing went wrong and the user is logged,
    // parse the list of teams and change the "validated"
    // attribute of the team whose ID is the one passed as 
    // parameter
    teams = teams.map((t) => {
      if (t.id == teamId) {
        t.validated = 1;
        team = t;
      }
      return t;
    });

    try {
      // Writes the list back into the file
      fs.writeFileSync(PATHS.TEAMS, yaml.dump(teams), 'utf8');
      resolve({ result: true, teams: teams });
    } catch (error) {
      console.log(error);
      resolve({ result: false });
    }
  }).then((result) => {
    if (result.result) {
      // nothing went wrong, send them a confirmation email
      sendValidationConfirmationEmail(team);
      res.json({ result: "OK", teams: result.teams })
    } else {
      res.json({ result: "KO" })
    }
  })
});

/**
 * POST API endpoint to change the paiement status of a team.
 * 
 * The user must be logged in to use this endpoint.
 * 
 * @param {number} teamId - The ID of the team to validate
 * @param {number} paiementStatus - The new paiement status
 * @returns {json} { result: "OK" , teams: [] } || { result: "KO"}
 */
app.post("/api/updatePaiementStatus", (req, res) => {
  new Promise((resolve) => {
    session = req.session;

    // If the user is not logged, return an error
    if (!session.isLogged) {
      resolve({ result: false });
    }

    let teamId = req.body.teamId;
    let paiementStatus = req.body.paiementStatus;
    // If any of the required parameter was not given, return an error
    if (!teamId || !paiementStatus) {
      resolve({ result: false });
    }

    let teams = getTeams();
    // If an error occured while getting the list of team, return an error
    if (teams == null) {
      resolve({ result: false });
    }

    // If nothing went wrong and the user is logged,
    // parse the list of teams and change the "paiementStatus"
    // attribute of the team whose ID is the one passed as 
    // parameter
    teams = teams.map((t) => {
      if (t.id == teamId) {
        t.paiementStatus = paiementStatus;
      }
      return t;
    });

    try {
      // Writes the list back into the file
      fs.writeFileSync(PATHS.TEAMS, yaml.dump(teams), 'utf8');
      resolve({ result: true, teams: teams });
    } catch (error) {
      console.log(error);
      resolve({ result: false });
    }
  }).then((result) => {
    if (result.result) {
      res.json({ result: "OK", teams: result.teams })
    } else {
      res.json({ result: "KO" })
    }
  })
});


// ***** START ***** //
/**
 * Starts the server.
 */

// ***** FUNCTIONS ***** //
/**
 * Loads the file "config.yml" and sets the retrieved values
 * in the "config" var. 
 */
function loadConfig() {
  // Load the tournament information
  try {
    config = yaml.load(fs.readFileSync(PATHS.CONFIG, 'utf8'));
    // mailjet = require('node-mailjet')
    // .connect(config.MAILJET.API_KEY, config.MAILJET.API_SECRET);
  } catch (e) {
    console.log(e);
  }
}

/**
 * Loads information about the tournament from the file "tournament.yml" and
 * calculate the number of validated teams from the liste of teams 
 * and returns these information in an object. 
 * @returns {json} a json object containing data about the tournament, or and empty json
 * object if there was an error.
 */
function getTournamentInformation() {
  // Load the tournament information
  try {
    let tournamentInformation = yaml.load(fs.readFileSync(PATHS.TOURNAMENT, 'utf8'));
    let teams = getTeams() ?? [];
    tournamentInformation.registeredNbrTeams = teams.reduce((prev, curr) => { return curr.validated ? prev + 1 : prev }, 0);
    return tournamentInformation;
  } catch (e) {
    console.log(e);
  }
  return {};
}

function getCurrentDateTime() {
  var today = new Date();
  var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  return date + ' ' + time;
}

function getTeams() {
  try {
    let teams = yaml.load(fs.readFileSync(PATHS.TEAMS, 'utf8'));
    if (!teams || teams.length == 0) {
      teams = [];
    }
    return teams;
  } catch (error) {
    console.log(error);
    return null;
  }
}

function getEmailTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "petanque.staubin@gmail.com",
      pass: "*******",
    },
  });
}

async function sendRegistrationConfirmationEmail(team) {

  // create reusable transporter object using the default SMTP transport
  const transporter = getEmailTransporter();

  // send mail with defined transport object
  const emailToCaptain = await transporter.sendMail({
    from: '"Tournoi de pétanque Saint-Aubin" <petanque.staubin@gmail.com>', // sender address
    to: team.captain.email, // list of receivers
    subject: "Demande d'inscription tournoi de pétanque Saint-Aubin", // Subject line
    text: "Votre demande d'inscription a bien été prise en compte et sera validée par nos soins dans les plus brefs délais. Vous en serez informé par mail !",
    html: `<p>Bonjour ${team.captain.name},</p>
           <p>Votre demande d'inscription au tournoi de pétanque de Saint-Aubin bien été prise en compte et sera validée par nos soins dans les plus brefs délais. Vous en serez directement informé par mail.</p>
           <p>En cas de question, n'hésitez pas à prendre contact avec nous en répondant à cet email !</p>
           <p>Avec nos meilleures salutations,<br>Le comité d'organisation</p>
           <br>
           <img src="cid:logo" width="150" height="150"/>`,
    attachments: [{
      filename: "logo-petanque_2022.png",
      path: "./server/logo-petanque_2022.png",
      cid: "logo"
    }]
  });

  const emailToComite = await transporter.sendMail({
    from: '"Tournoi de pétanque Saint-Aubin" <petanque.staubin@gmail.com>', // sender address
    to: "petanque.staubin@gmail.com", // list of receivers
    subject: "Demande d'inscription tournoi de pétanque Saint-Aubin", // Subject line
    html: `<p>Nouvelle demande d'inscription reçue pour l'équipe <strong>${team.teamName}</strong></p>
           <p><a href="https://petanque.jeunesse-1566.ch/login">Se connecter au panel administrateur</a></p>
           <br>
           <img src="cid:logo" width="150" height="150"/>`,
    attachments: [{
      filename: "logo-petanque_2022.png",
      path: "./server/logo-petanque_2022.png",
      cid: "logo"
    }]
  });

}

async function sendValidationConfirmationEmail(team) {

  // create reusable transporter object using the default SMTP transport
  const transporter = getEmailTransporter();

  // tournament information
  const tournamentInformation = getTournamentInformation();

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Tournoi de pétanque Saint-Aubin" <petanque.staubin@gmail.com>', // sender address
    to: team.captain.email, // list of receivers
    subject: "Confirmation d'inscription au tournoi de pétanque Saint-Aubin", // Subject line
    text: `Par cet email, nous vous confirmons l'inscription de l'équipe ${team.teamName} au tournoi de pétanque de Saint-Aubin qui aura lieu le ${tournamentInformation.tournamentDate}`,
    html: `<p>Bonjour ${team.captain.name},</p>
           <p>Nous vous confirmons que votre inscription de l'équipe <strong>${team.teamName}</strong> est validée et nous réjouissons de passer un moment convivial à vos côtés !<br>
           Pour ce qui est de la suite, un mail contenant le programme vous sera envoyé quelques jours avant le tournoi, qui, pour rappel, aura lieu le ${tournamentInformation.tournamentDate}. <br>
           En cas de question, n'hésitez pas à prendre contact avec nous en répondant à cet email !</p>
           <p>Avec nos meilleures salutations,<br>Le comité d'organisation</p>
           <br>
           <img src="cid:logo" width="150" height="150"/>`,
    attachments: [{
      filename: "logo-petanque_2022.png",
      path: "./server/logo-petanque_2022.png",
      cid: "logo"
    }]
  });
}