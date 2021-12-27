import Header from './Header'
import RegisterTeamPageBody from './RegisterTeamPageBody'
import CantRegisterTeamPageBody from './CantRegisterTeamPageBody'

const RegisterTeam = ({ tournamentYear, totalNbrTeams, registeredNbrTeams, registrationDeadline }) => {
    return (
        <div className="App">
            <Header tournamentYear={tournamentYear} />
            {
                (totalNbrTeams === registeredNbrTeams) || new Date(registrationDeadline).getTime() < new Date().getTime()
                    ? <CantRegisterTeamPageBody />
                    : <RegisterTeamPageBody />
            }

        </div>
    )
}

RegisterTeam.defaultProps = {
    tournamentYear: "20??"
}

export default RegisterTeam
