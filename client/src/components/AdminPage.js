import Header from './Header';
import Footer from './Footer';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import Axios from 'axios'
import Swal from 'sweetalert2'
import DataTable from 'react-data-table-component';
import './css/AdminPage.css';

const AdminPage = ({ tournamentYear, totalNbrTeams }) => {

    const navigate = useNavigate();

    const [teamList, setTeamList] = useState([]);

    // Fetch data from the NodeJS server to get information about the tournament
    useEffect(() => {
        // TODO: Change the URL in DEV
        fetch("/api/getTeams")
            .then((res) => res.json())
            .then((data) => {
                if (data.result === "OK") {
                    setTeamList(data.teams);
                } else if (data.isLogged === false) {
                    navigate('/login');
                }
            });
    }, []);

    const validateTeam = (teamName, teamId) => {
        Axios.post("/api/validateTeam", { teamId: teamId }).then((res) => {
            if (res.data.result === "OK" && res.data.teams) {
                setTeamList(res.data.teams);
                Swal.fire({
                    icon: 'success',
                    title: 'Equipe validée',
                    html: `L'inscription de l'équipe <b>${teamName}</b> a bien été validée. Il faut leur envoyer un mail pour les prévenir !`,
                    showConfirmButton: true
                });
            }
        });
    };

    const onPaiementStatusSelectChange = (teamId, event) => {
        Axios.post("/api/updatePaiementStatus", { teamId: teamId, paiementStatus: event.target.value }).then((res) => {
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
                <select value={team.paiementStatus} onChange={(event) => onPaiementStatusSelectChange(team.id,event)}>
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

                <Footer />
            </div>
        </div>
    )
}

export default AdminPage
