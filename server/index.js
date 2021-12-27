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
app.get("/api", (req, res) => {
  session = req.session;
  res.json({ result: "OK", apiStatus: "Running...", logged: session.isLogged });
});

app.get("/api/getTournamentInformation", (req, res) => {
  res.json({ result: "OK", tournamentInformation: getTournamentInformation() });
});

app.get("/api/getTeams", (req, res) => {
  session = req.session;
  // if (session.isLogged) {
    try {
      let teams = yaml.load(fs.readFileSync(PATHS.TEAMS, 'utf8'));
      if (!teams || teams.length == 0) {
        teams = [];
      }
      res.json({ result: "OK", teams: teams })
    } catch (e) {
      console.log(e);
      res.json({ result: "KO" })
    }
  // } else {
  //   res.json({ result: "KO", isLogged: false })
  // }
});

app.post("/api/login", (req, res) => {
  session = req.session;
  new Promise(resolve => {
    if (session.isLogged) {
      resolve(true);
    }
    if (req.body.username && req.body.password) {
      if (req.body.username === config.ADMIN.USERNAME && req.body.password === config.ADMIN.PASSWORD) {
        resolve(true);
      } else {
        resolve(false)
      }
    }
  }).then((logged) => {
    if (logged) {
      session.isLogged = true;
      console.log(session);
      res.json({ result: "OK" });
    } else {
      res.json({ result: "KO" });
    }
  });
});

// Registers a new team in the list. This new team still needs to be validated by an admin
app.post("/api/registerTeam", (req, res) => {
  try {
    let teams = yaml.load(fs.readFileSync(PATHS.TEAMS, 'utf8'));
    if (!teams || teams.length == 0) {
      teams = [];
    }
    let highestId = teams.reduce((prev, curr) => { return curr.id > prev ? curr.id : prev }, 0) + 1;

    let newTeam = {
      ...req.body,
      id: highestId,
      validated: false,
      paiementStatus: 0,
      registrationDate: getCurrentDateTime(),
    };
    teams.push(newTeam);

    fs.writeFileSync(PATHS.TEAMS, yaml.dump(teams), 'utf8');
    // sendRegistrationConfirmationEmail(newTeam);
    res.json({ result: "OK" })
  } catch (e) {
    console.log(e);
    res.json({ result: "KO" })
  }

});


// ***** START ***** //
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  loadConfig();
});

// ***** FUNCTIONS ***** //
function loadConfig() {
  // Load the tournament information
  try {
    config = yaml.load(fs.readFileSync(PATHS.CONFIG, 'utf8'));
    mailjet = require('node-mailjet')
      .connect(config.MAILJET.API_KEY, config.MAILJET.API_SECRET);
  } catch (e) {
    console.log(e);
  }
}

function getTournamentInformation() {
  // Load the tournament information
  try {
    let tournamentInformation = yaml.load(fs.readFileSync(PATHS.TOURNAMENT, 'utf8'));
    let teams = yaml.load(fs.readFileSync(PATHS.TEAMS, 'utf8'));
    tournamentInformation.registeredNbrTeams = teams.length;
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