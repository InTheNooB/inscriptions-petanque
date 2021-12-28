import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import React from 'react';
import Header from './components/Header'
import HomePageBody from './components/HomePageBody'
import RegisterTeam from './components/RegisterTeam'
import LoginPage from "./components/LoginPage";
import AdminPage from "./components/AdminPage";


function App() {

  // Main page "/"
  const MainPage = () => {
    return (
      <div className="App">
        <Header tournamentYear={tournamentInformation.tournamentYear} />
        <HomePageBody
          totalNbrTeams={tournamentInformation.totalNbrTeams}
          registeredNbrTeams={tournamentInformation.registeredNbrTeams}
          registrationDeadline={tournamentInformation.registrationDeadline}
          tournamentDate={tournamentInformation.tournamentDate}
        />
      </div>
    );
  }

  // Information about the upcoming tournament
  const [tournamentInformation, setTournamentInformation] = React.useState({});

  // Fetch data from the NodeJS server to get information about the tournament
  React.useEffect(() => {
    fetch("/api/getTournamentInformation")
      .then((res) => res.json())
      .then((data) => setTournamentInformation(data.tournamentInformation));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" exact element={<MainPage />} />
        <Route path="/registerTeam" exact element={<RegisterTeam
          tournamentYear={tournamentInformation.tournamentYear}
          totalNbrTeams={tournamentInformation.totalNbrTeams}
          registeredNbrTeams={tournamentInformation.registeredNbrTeams}
          registrationDeadline={tournamentInformation.registrationDeadline} />} />
        <Route path="/login" exact element={<LoginPage
          tournamentYear={tournamentInformation.tournamentYear}
          totalNbrTeams={tournamentInformation.totalNbrTeams}
          registeredNbrTeams={tournamentInformation.registeredNbrTeams}
          registrationDeadline={tournamentInformation.registrationDeadline} />} />
        <Route path="/admin" excat element={<AdminPage
          tournamentYear={tournamentInformation.tournamentYear}
          totalNbrTeams={tournamentInformation.totalNbrTeams}

        />} />
      </Routes>
    </Router>
  );
}

export default App;
