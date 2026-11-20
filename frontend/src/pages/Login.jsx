import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useForm from '../hooks/useForm';
import FormField from '../components/FormField';
import { onlyErrors, validateEmail } from '../utils/validation';
import { HOME_BY_ROLE } from '../utils/roles';

const validate = (values) =>
  onlyErrors({
    email: validateEmail(values.email),
    password: values.password ? '' : 'Password is required',
  });

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const form = useForm({ email: '', password: '' }, validate);

  const onSubmit = form.handleSubmit(async (values) => {
    const user = await login(values);
    showToast(`Welcome back, ${user.name}`);
    navigate(HOME_BY_ROLE[user.role], { replace: true }); // role decides the dashboard
  });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Store Rating App</h1>
        <p className="muted">Log in to continue</p>

        {form.formError && <div className="alert alert-error">{form.formError}</div>}

        <form onSubmit={onSubmit} noValidate>
          <FormField label="Email" name="email" type="email" value={form.values.email} onChange={form.handleChange} error={form.errors.email} autoComplete="username" />
          <FormField label="Password" name="password" type="password" value={form.values.password} onChange={form.handleChange} error={form.errors.password} autoComplete="current-password" />
          <button className="btn btn-primary btn-block" disabled={form.submitting}>
            {form.submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="auth-footer">
          New here? <Link to="/signup">Create an account</Link>
        </p>

        <details className="demo-box">
          <summary>Demo accounts</summary>
          <table>
            <tbody>
              <tr><td>Admin</td><td>admin@storerating.com</td><td>Admin@123</td></tr>
              <tr><td>User</td><td>user@storerating.com</td><td>User@1234</td></tr>
              <tr><td>Owner</td><td>owner@storerating.com</td><td>Owner@123</td></tr>
            </tbody>
          </table>
        </details>
      </div>
    </div>
  );
}
