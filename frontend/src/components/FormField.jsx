// Label + input (or select/textarea) + error message, used by every form.
export default function FormField({ label, name, error, as: Tag = 'input', children, ...inputProps }) {
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <Tag id={name} name={name} className={error ? 'input-error' : ''} {...inputProps}>
        {children}
      </Tag>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
