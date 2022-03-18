import Header from "./Header"
import FormInput from './FormInput'
import RegisterButton from "./RegisterButton";
import Swal from 'sweetalert2'
import Footer from "./Footer";
import { useState } from 'react';
import Axios from 'axios';
import { useNavigate } from "react-router-dom";
import './css/LoginPage.css';

const LoginPage = ({ tournamentYear, totalNbrTeams, registeredNbrTeams, registrationDeadline }) => {

    const [formValues, setFormValues] = useState({
        username: "",
        password: ""
    });

    const navigate = useNavigate();

    const onFormSubmit = async (e) => {
        e.preventDefault();
        // TODO: Change the URL in DEV
        Axios.post("https://serv.elwan.ch:3001/api/login", formValues, {withCredentials: true}).then((res) => {
            new Promise(resolve => {
                if (res.data.result === "OK") {
                    resolve(true);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Compte inconnu',
                        text: 'Les informations de connexion passées ne correspondent à aucun compte.',
                        showConfirmButton: true
                    }).then(() => resolve(false));
                }
            }).then((correctCreds) => {
                if (correctCreds) {
                    navigate('/admin');
                }
            });
        });

    };


    return (
        <div className="App">
            <Header tournamentYear={tournamentYear} />
            <div className="body-container registerteampagebody-container">
                <h1>Connexion administrateur</h1>
                <form onSubmit={onFormSubmit}>
                    <FormInput name="username" placeholder="username" label="Nom d'utilisateur" value={formValues.username} onChange={(e) => setFormValues({ ...formValues, username: e.target.value })} />
                    <FormInput type="password" name="password" placeholder="password" label="Mot de passe" value={formValues.password} onChange={(e) => setFormValues({ ...formValues, password: e.target.value })} />
                    <RegisterButton text="Se connecter" type='submit' />
                </form>
                <Footer />
            </div>
        </div>
    )
}

export default LoginPage
