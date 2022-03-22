import './css/RemainingPlaces.css';

const RemainingPlaces = ({ totalTeams, registeredTeams, registrationDeadline }) => {

    const formatDateIncludeDayOfWeek = (date) => {
        if (!date) {
            return "";
        }
        return new Date(date.replace(/-/g, "/")).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "numeric",
            year: "numeric",
        });
    }

    return (
        <div className="remainingplaces-container">
            <h2>Equipes inscrites : {registeredTeams}/{totalTeams}</h2>
            {totalTeams > registeredTeams
                ? <>
                    <h2>Il reste encore <u>{totalTeams - registeredTeams}</u> places !</h2>
                    <h2>Les inscriptions sont ouvertes jusqu'au <u>{formatDateIncludeDayOfWeek(registrationDeadline)}</u></h2>
                </>
                : <h2>Le tournois est complet !</h2>}

        </div>
    )
}

RemainingPlaces.defaultProps = {
    totalTeams: 0,
    registeredTeams: 0,
    registrationDeadline: '24.06.2022'
}

export default RemainingPlaces
