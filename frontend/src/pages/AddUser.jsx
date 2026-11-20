import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/endpoints';
import { useToast } from '../context/ToastContext';
import useForm from '../hooks/useForm';
import FormField from '../components/FormField';
import { onlyErrors, validateAddress, validateEmail, validateName, validatePassword } from '../utils/validation';

const validate = (values) =>
  onlyErrors({
    name: validateName(values.name),
    email: validateEmail(values.email),
    address: validateAddress(values.address),
    password: validatePassword(values.password),
    role: values.role ? '' : 'Please choose a role',
  });

export default function AddUser() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const form = useForm({ name: '', email: '', address: '', password: '', role: 'user' }, validate);

  const onSubmit = form.handleSubmit(async (values) => {
    await adminApi.createUser(values);
    showToast('User added successfully');
    navigate('/admin/users');
  });

  return (
    <div className="card form-card">
      <h1>Add User</h1>

      {form.formError && <div className="alert alert-error">{form.formError}</div>}

      <form onSubmit={onSubmit} noValidate>
        <FormField label="Full name (20 to 60 characters)" name="name" value={form.values.name} onChange={form.handleChange} error={form.errors.name} />
        <FormField label="Email" name="email" type="email" value={form.values.email} onChange={form.handleChange} error={form.errors.email} />
        <FormField label="Address (max 400 characters)" name="address" as="textarea" rows={3} value={form.values.address} onChange={form.handleChange} error={form.errors.address} />
        <FormField label="Password" name="password" type="password" value={form.values.password} onChange={form.handleChange} error={form.errors.password} autoComplete="new-password" />
        <p className="hint">8 to 16 characters, with at least one uppercase letter and one special character.</p>
        <FormField label="Role" name="role" as="select" value={form.values.role} onChange={form.handleChange} error={form.errors.role}>
          <option value="user">Normal User</option>
          <option value="admin">Admin</option>
          <option value="owner">Store Owner</option>
        </FormField>
        <button className="btn btn-primary" disabled={form.submitting}>
          {form.submitting ? 'Saving...' : 'Add user'}
        </button>
      </form>
    </div>
  );
}
