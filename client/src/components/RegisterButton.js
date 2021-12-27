import './css/RegisterButton.css';

const RegisterButton = ({text, onClick, type}) => {
    return (
        <div className='registerbutton-container'>
            <button type={type} className='registerbutton-button' onClick={onClick}>
            {text}
            </button>
        </div>
    )
}

RegisterButton.defaultProps = {
    text: "Bouton",
    onClick : () => console.log("Button pressed"),
    type: 'button'
}

export default RegisterButton
