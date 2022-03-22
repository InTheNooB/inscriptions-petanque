import Header from './Header';
import Footer from './Footer';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import FormInput from './FormInput'
import { useNavigate } from "react-router-dom";
import Axios from 'axios'
import Swal from 'sweetalert2'
import RegisterButton from './RegisterButton'
import DataTable from 'react-data-table-component';
import './css/AdminPage.css';

const AdminPage = ({ tournamentYear, totalNbrTeams }) => {

    const navigate = useNavigate();
    const [teamList, setTeamList] = useState([]);
    const emptyForm = {
        teamName: "",
        captainName: "",
        captainEmail: "",
        captainPhone: ""
    };
    const [formValues, setFormValues] = useState({ ...emptyForm });

    // Fetch data from the NodeJS server to get information about the tournament
    useEffect(() => {
        loadTeamList();
    }, []);

    const loadTeamList = async () => {
        // TODO: Change the URL in DEV
        fetch("https://serv.elwan.ch:3001/api/getTeams", { credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                if (data.result === "OK") {
                    setTeamList(data.teams);
                } else if (data.isLogged === false) {
                    navigate('/login');
                }
            });
    }

    // Called once the visitor submits the registration form
    const registerTeam = async (e) => {
        e.preventDefault();
        const { value: accept } = await Swal.fire({
            title: 'Règlement du tournoi',
            input: 'checkbox',
            inputValue: 0,
            inputPlaceholder:
                'En inscrivant une équipe via ce formulaire, aucun mail ne lui sera envoyé lors de cette étape.',
            confirmButtonText:
                'Continue <i class="fa fa-arrow-right"></i>',
            inputValidator: (result) => {
                return !result && 'Vous devez cocher la case pour continuer.'
            }
        })

        if (accept) {
            // Sends a request to the NodeJS server to register a team
            let params = {
                teamName: formValues.teamName,
                captain: {
                    name: formValues.captainName,
                    email: formValues.captainEmail,
                    phone: formValues.captainPhone
                },
                sendEmail: false
            }

            // TODO: Change the URL in DEV
            Axios.post("https://serv.elwan.ch:3001/api/registerTeam", params, { withCredentials: true }).then((res) => {
                new Promise(resolve => {
                    if (res.data.result !== "OK") {
                        Swal.fire({
                            icon: 'error',
                            title: 'Une erreur est survenue lors de l\'inscription.',
                            text: 'Merci de prendre contact avec M. Lionel Ding au 079 199 67 08',
                            showConfirmButton: true
                        }).then(resolve);
                    } else {
                        resolve();
                    }
                }).then(() => {
                    setFormValues({ ...emptyForm });
                    loadTeamList();
                    navigate('/admin');
                });
            });
        }
    };

    const validateTeam = (teamName, teamId) => {
        Axios.post("https://serv.elwan.ch:3001/api/validateTeam", { teamId: teamId }, { withCredentials: true }).then((res) => {
            if (res.data.result === "OK" && res.data.teams) {
                setTeamList(res.data.teams);
                Swal.fire({
                    icon: 'success',
                    title: 'Equipe validée',
                    html: `L'inscription de l'équipe <b>${teamName}</b> a bien été validée. Un mail a été envoyé au capitaine pour le prévenir !`,
                    showConfirmButton: true
                });
            }
        });
    };

    const onPaiementStatusSelectChange = (teamId, event) => {
        Axios.post("https://serv.elwan.ch:3001/api/updatePaiementStatus", { teamId: teamId, paiementStatus: event.target.value }, { withCredentials: true }).then((res) => {
            if (res.data.result === "OK" && res.data.teams) {
                setTeamList(res.data.teams);
            }
        });

    };

    const columns = [
        {
            name: "Nom d'équipe",
            selector: row => row.teamName,
            sortable: true
        },
        {
            name: "Nom du capitain",
            selector: row => row.captain.name,
            sortable: true
        },
        {
            name: "Téléphone du capitaine",
            selector: row => row.captain.phone,
            sortable: true
        },
        {
            name: "Email du capitaine",
            selector: row => row.captain.email,
            sortable: true
        },
        {
            name: "Date d'inscription",
            selector: row => row.registrationDate,
            sortable: true
        },
        {
            name: "Etat du paiement",
            selector: row => row.paiementStatusSelect,
            sortable: true
        },
        {
            name: "Validé ?",
            selector: row => row.validatedIcon,
            sortable: true
        },
    ];

    const data = teamList.map((team) => {
        return {
            ...team,
            validatedIcon: team.validated ? <FaCheckCircle size="20" className='icon check-icon' /> : <FaTimesCircle size="20" className='icon times-icon' onClick={() => validateTeam(team.teamName, team.id)} />,
            paiementStatusSelect: (
                <select value={team.paiementStatus} onChange={(event) => onPaiementStatusSelectChange(team.id, event)}>
                    <option disabled></option>
                    <option value="0">Pas payé</option>
                    <option value="1">Payé en liquide</option>
                    <option value="2">Payé via Twint</option>
                </select>
            )
        };
    })

    return (
        <div className="App">
            <Header tournamentYear={tournamentYear} />
            <div className="body-container adminpage-body">
                <h1>Panel Administrateur</h1>
                <h4>Equipes inscrite: {teamList.length} </h4>
                <h4>Equipes validées: {teamList.reduce((prev, curr) => {
                    return prev + (curr.validated ? 1 : 0)
                }, 0)} / {totalNbrTeams}</h4>
                {teamList.length === 0 ? <h2>Aucune équipe inscrite</h2> :
                    <div className='team-list-container'>
                        <DataTable
                            columns={columns}
                            data={data}
                            pagination
                        />
                    </div>
                }
                <div className="registerteampagebody-container">
                    <h1>Inscrire une équipe !</h1>
                    <form onSubmit={registerTeam}>
                        <FormInput name="teamName" placeholder="Equipe" label="Nom de l'équipe" value={formValues.teamName} onChange={(e) => setFormValues({ ...formValues, teamName: e.target.value })} />
                        <FormInput name="captainName" placeholder="Nom Prénom" label="Nom & Prénom du/de la capitaine" value={formValues.captainName} onChange={(e) => setFormValues({ ...formValues, captainName: e.target.value })} />
                        <FormInput type="email" name="captaineEmail" placeholder="mon@adresse.ch" label="Adresse email du/de la capitaine" value={formValues.captainEmail} onChange={(e) => setFormValues({ ...formValues, captainEmail: e.target.value })} />
                        <FormInput name="captainPhone" placeholder="079 123 45 67" label="Téléphone du/de la capitaine" value={formValues.captainPhone} onChange={(e) => setFormValues({ ...formValues, captainPhone: e.target.value })} />
                        <RegisterButton text="Inscrire une équipe" type='submit' />
                    </form>
                </div>
                <Footer />
            </div>
        </div>
    )
}

export default AdminPage
