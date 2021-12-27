import Footer from "./Footer";
import './css/RegisterTeamPageBody.css'

const CantRegisterTeamPageBody = ({ totalNbrTeams, registeredNbrTeams, registrationDeadline }) => {

    return (
        <div className="body-container registerteampagebody-container">
            <h1>Les inscriptions sont fermées.</h1>
            <Footer />
        </div>
    )
}

export default CantRegisterTeamPageBody
