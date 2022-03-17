import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import FormInput from './FormInput'
import RegisterButton from './RegisterButton'
import Swal from 'sweetalert2'
import Footer from './Footer';
import Axios from 'axios'

import './css/RegisterTeamPageBody.css'


const RegisterTeamPageBody = () => {

    const navigate = useNavigate();

    const [formValues, setFormValues] = useState({
        teamName: "",
        captainName: "",
        captainEmail: "",
        captainPhone: ""
    });



    // Called once the visitor submits the registration form
    const registerTeam = async (e) => {
        e.preventDefault();
        const { value: accept } = await Swal.fire({
            title: 'Règlement du tournoi',
            input: 'checkbox',
            inputValue: 1,
            inputPlaceholder:
                'J\'ai bien pris connaissance que le tournoi est en <b>triplette</b> et que la participation coûte <b>45CHF par équipe</b>.',
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
                }
            }

    // TODO: Change the URL in DEV
            Axios.post("https://serv.elwan.ch:3001/api/registerTeam", params).then((res) => {
                new Promise(resolve => {
                    if (res.data.result === "OK") {
                        Swal.fire({
                            icon: 'success',
                            title: 'Demande d\'inscription envoyée !',
                            text: 'Vous allez recevoir un mail de confirmation dans les jours qui viennent',
                            showConfirmButton: true
                        }).then(resolve);
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Une erreur est survenue lors de l\'inscription.',
                            text: 'Merci de prendre contact avec M. Lionel Ding au 079 199 67 08',
                            showConfirmButton: true
                        }).then(resolve);
                    }
                }).then(() => {
                    navigate('/');
                });
            });
        }
    };


    return (
        <div className="body-container registerteampagebody-container">
            <h1>Inscrire une équipe !</h1>
            <form onSubmit={registerTeam}>
                <FormInput name="teamName" placeholder="Equipe" label="Nom de l'équipe" value={formValues.teamName} onChange={(e) => setFormValues({ ...formValues, teamName: e.target.value })} />
                <FormInput name="captainName" placeholder="Nom Prénom" label="Nom & Prénom du/de la capitaine" value={formValues.captainName} onChange={(e) => setFormValues({ ...formValues, captainName: e.target.value })} />
                <FormInput type="email" name="captaineEmail" placeholder="mon@adresse.ch" label="Adresse email du/de la capitaine" value={formValues.captainEmail} onChange={(e) => setFormValues({ ...formValues, captainEmail: e.target.value })} />
                <FormInput name="captainPhone" placeholder="079 123 45 67" label="Téléphone du/de la capitaine" value={formValues.captainPhone} onChange={(e) => setFormValues({ ...formValues, captainPhone: e.target.value })} />
                <RegisterButton text="Inscrire une équipe" type='submit' />
            </form>
            <Footer />
        </div>
    )
}

export default RegisterTeamPageBody
