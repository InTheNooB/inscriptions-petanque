// ***** IMPORTS ***** // 
const yaml = require('js-yaml');
const fs = require('fs');
const express = require("express");
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const PORT = process.env.PORT || 3001;
const app = express();

// ***** SESSION ***** // 
// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;

//session middleware
app.use(sessions({
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false
}));

// ***** EXPRESS ***** //
app.use(express.json());
app.use(cookieParser());


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

  // Add the new team to the list
  teams.push(newTeam);

  try {
    // Writes the list back into the file
    fs.writeFileSync(PATHS.TEAMS, yaml.dump(teams), 'utf8');
    // sendRegistrationConfirmationEmail(newTeam);
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
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  loadConfig();
});

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

function sendRegistrationConfirmationEmail(team) {
  const request = mailjet
    .post("send", { 'version': 'v3.1' })
    .request({
      "Messages": [{
        "From": {
          "Email": "webmaster@jeunesse-1566.ch",
          "Name": "Comité Pétanque"
        },
        "To": [{
          "Email": team.captain.email,
          "Name": team.captain.name
        }],
        "Subject": "Tournoi Pétanque",
        "TextPart": "Votre demande d'inscription a bien été prise en compte et sera validée par nos soins dans les plus brefs délais. Vous en serez informé par mail et par message !",
        "HTMLPart": "<h3>Demande d'inscription envoyée avec succès !</h3><br />Votre demande d'inscription a bien été prise en compte et sera validée par nos soins dans les plus brefs délais. Vous en serez informé par mail et par message !"
      }]
    })
  request
    .then((result) => {
      console.log(result.body)
    })
    .catch((err) => {
      console.log(err.statusCode)
    })
}