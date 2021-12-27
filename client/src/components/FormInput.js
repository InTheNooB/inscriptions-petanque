import './css/FormInput.css';

const FormInput = ({ type, name, placeholder, label, value, onChange }) => {
    return (
        <div className="forminput-container">
            <label htmlFor={name}>{label}</label>
            <input type={type} name={name} placeholder={placeholder} value={value} onChange={onChange} required/>
        </div>
    )
}

FormInput.defaultProps = {
    type: "text",
    name: "noName",
    placeholder: "placeholder",
    label: "noName",
    value: "",
    onChange: () => {}
}

export default FormInput
