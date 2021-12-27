import Header from './Header';
import Footer from './Footer';
import { useEffect, useState } from 'react'
import './css/AdminPage.css';
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa'

const AdminPage = ({ tournamentYear, }) => {


    const navigate = useNavigate();

    const [teamList, setTeamList] = useState([]);

    // Fetch data from the NodeJS server to get information about the tournament
    useEffect(() => {
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


    return (
        <div className="App">
            <Header tournamentYear={tournamentYear} />
            <div className="body-container adminpage-body">
                <h1>Panel Administrateur</h1>
                <h4>Equipes inscrite: {teamList.length} </h4>
                <h4>Equipes validées: {teamList.reduce((prev, curr) => {
                    return prev + (curr.validated ? 1 : 0)
                }, 0)}</h4>
                <table className='team-list-container'>
                    <tbody>
                        <tr>
                            <th>
                                <p>Nom d'équipe</p>
                            </th>
                            <th>
                                <p>Nom du capitain</p>
                            </th>
                            <th>
                                <p>Téléphone du capitaine</p>
                            </th>
                            <th>
                                <p>Email du capitaine</p>
                            </th>
                            <th>
                                <p>Date d'inscription</p>
                            </th>
                            <th>
                                <p>Etat du paiement</p>
                            </th>
                            <th>
                                <p>Validé ?</p>
                            </th>
                        </tr>
                        {
                            teamList.map((team) => {
                                return (
                                    <tr key={team.id} >
                                        <td>
                                            <input type="text" value={team.teamName} readOnly />
                                        </td>
                                        <td>
                                            <input type="text" value={team.captain.name} readOnly />
                                        </td>
                                        <td>
                                            <input type="text" value={team.captain.phone} readOnly />
                                        </td>
                                        <td>
                                            <input type="text" value={team.captain.email} readOnly />
                                        </td>
                                        <td>
                                            <input type="text" value={team.registrationDate} readOnly />
                                        </td>
                                        <td>
                                            <input type="text" value={team.paiementStatus} readOnly />
                                        </td>
                                        <td>
                                            {team.validated ? <FaCheckCircle size="20" className='check-icon'/> : <FaTimesCircle size="20" className='times-icon'/>} 
                                        </td>
                                    </tr>)
                            })
                        }
                    </tbody>
                </table>

                <Footer />
            </div>
        </div>
    )
}

export default AdminPage
