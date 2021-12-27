import RemainingPlaces from "./RemainingPlaces"
import RegisterButton from "./RegisterButton"
import InfoCardContainer from "./InfoCardContainer"
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
import './css/HomePageBody.css'

const HomePageBody = ({ totalNbrTeams, registeredNbrTeams, registrationDeadline,tournamentDate }) => {

    const navigate = useNavigate();

    const changeRoute = (path) => {
        navigate('/' + path);
    }

    return (
        <div className="body-container">
            <RemainingPlaces
                totalTeams={totalNbrTeams}
                registeredTeams={registeredNbrTeams}
                registrationDeadline={registrationDeadline}
            />
            {totalNbrTeams > registeredNbrTeams
                ? <RegisterButton text="Inscrire une équipe" onClick={() => changeRoute('registerTeam')} />
                : <div style={{ marginBottom: "3em" }}></div>}
            <InfoCardContainer tournamentDate={tournamentDate}/>
            <Footer />
        </div>
    )
}

export default HomePageBody
