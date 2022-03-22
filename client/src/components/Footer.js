import logoJeunesse from '../assets/logo_jeunesse.png';
import './css/Footer.css';

const Footer = () => {
    return (
        <>
            <img className='logo-jeunesse' src={logoJeunesse} alt="logo jeunesse"></img>
            <div className="footer">
                <p>Site web par <a href="https://support-informatique.ch">Support-Informatique</a></p>
                <p>N'hésitez pas à nous contacter si vous avez besoin d'un site web</p>
            </div>
        </>
    )
}

export default Footer
