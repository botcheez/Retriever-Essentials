// Reusable labeled input. Any extra props (type, name, value, onChange,
// required...) are passed straight to the <input> via {...props}.
function Input({ label, ...props }) {
  return (
    <label className="field">
      {label}
      <input {...props} />
    </label>
  );
}

export default Input;
