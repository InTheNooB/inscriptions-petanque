import CardContentText from './CardContentText';
import './css/InfoCardElement.css'

const InfoCardElement = ({ width, height, textContent }) => {
    let style = {};
    if (width !== "") {
        style.width = width;
    }
    if (height !== "") {
        style.height = height;
    }
    return (
        <div
            style={style}
            className='infocardelement-container'>
            {textContent != null ?
                <CardContentText content={textContent} /> : ""
            }
        </div>
    );
}

InfoCardElement.defaultProps = {
    width: "",
    height: "",
    textContent: null
}

export default InfoCardElement
