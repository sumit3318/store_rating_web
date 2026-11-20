import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useForm from '../hooks/useForm';
import FormField from '../components/FormField';
import { onlyErrors, validateAddress, validateEmail, validateName, validatePassword } from '../utils/validation';
import { HOME_BY_ROLE } from '../utils/roles';

const validate = (values) =>
  onlyErrors({
    name: validateName(values.name),
    email: validateEmail(values.email),
    address: validateAddress(values.address),
    password: validatePassword(values.password),
  });

export default function Signup() {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const form = useForm({ name: '', email: '', address: '', password: '' }, validate);

  const onSubmit = form.handleSubmit(async (values) => {
    const user = await signup(values);
    showToast('Account created successfully');
    navigate(HOME_BY_ROLE[user.role], { replace: true });
  });

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <h1>Create your account</h1>
        <p className="muted">Sign up as a normal user to rate stores</p>

        {form.formError && <div className="alert alert-error">{form.formError}</div>}

        <form onSubmit={onSubmit} noValidate>
          <FormField label="Full name (20 to 60 characters)" name="name" value={form.values.name} onChange={form.handleChange} error={form.errors.name} />
          <FormField label="Email" name="email" type="email" value={form.values.email} onChange={form.handleChange} error={form.errors.email} />
          <FormField label="Address (max 400 characters)" name="address" as="textarea" rows={3} value={form.values.address} onChange={form.handleChange} error={form.errors.address} />
          <FormField label="Password" name="password" type="password" value={form.values.password} onChange={form.handleChange} error={form.errors.password} autoComplete="new-password" />
          <p className="hint">8 to 16 characters, with at least one uppercase letter and one special character.</p>
          <button className="btn btn-primary btn-block" disabled={form.submitting}>
            {form.submitting ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
