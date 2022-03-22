import InfoCardElement from "./InfoCardElement"
import "./css/InfoCardContainer.css"

const InfoCardContainer = ({ tournamentDate }) => {
    let d = new Date();
    let curr_date = d.getDate();
    let curr_month = d.getMonth() + 1; //Months are zero based
    let curr_year = d.getFullYear();
    let swissTournamentDate = curr_date + "." + curr_month + "." + curr_year;
    return (
        <div className="infocardcontainer-container">
            <InfoCardElement
                width={"200px"}
                height={"200px"}
                textContent={
                    <div>
                        <h2>Lieu du tournoi</h2>
                        <p>Centre Sportif</p>
                        <p>Rte de la Léchère</p>
                        <p>1566 Saint-Aubin FR</p>
                    </div>
                }
            />
            <InfoCardElement
                textContent={
                    <div>
                        <h2>Date du tournoi</h2>
                        <p>Le {swissTournamentDate} dès 07h30</p>
                    </div>
                }
            />
            <InfoCardElement
                width={"20em"}
                textContent={
                    <div>
                        <h2>Prix du tournoi</h2>
                        <p>Un montant de 45CHF par équipe est demandé afin de participer au tournoi.</p>
                        <p>Le paiement s'effectue sur place en arrivant.</p>
                        <p><b>Café + Croissant offert pour chaque participant.</b></p>
                    </div>

                }
            />
            <InfoCardElement
                width={"20em"}
                textContent={
                    <div>
                        <h2>Procédure d'inscription</h2>
                        <p>Après avoir rempli le formulaire d'inscription, votre demande sera validée par nos soins dans les jours suivants.</p>
                        <p>Vous recevrez ensuite un mail de confirmation avec des informations supplémentaires concernant le déroulement du tournoi.</p>
                    </div>
                }
            />
            <InfoCardElement
                textContent={
                    <div>
                        <h2>Contact</h2>
                        <p>Personne de contact en cas de problème avec le site</p>
                        <p>M. Lionel Ding</p>
                        <p>Mail : lionel.ding@hotmail.ch</p>
                        <p>Tel : 079 199 67 08</p>
                    </div>
                }
            />
        </div>

    )
}

export default InfoCardContainer
