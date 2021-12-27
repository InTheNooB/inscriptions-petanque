import headerBackground from '../assets/header-background.jpg';
import './css/Header.css';

const Header = ({tournamentYear}) => {
    return (
        <div className="header-container">
            <img className="header-background-image" alt="tournoi 2021" src={headerBackground}></img>
            <h1>Tournoi de pétanque {tournamentYear}</h1>
            <h4>Par la jeunesse de Saint-Aubin FR</h4>
        </div>
    )
}

export default Header
