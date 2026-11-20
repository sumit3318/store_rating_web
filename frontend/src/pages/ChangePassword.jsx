import { authApi } from '../services/endpoints';
import { useToast } from '../context/ToastContext';
import useForm from '../hooks/useForm';
import FormField from '../components/FormField';
import { onlyErrors, validatePassword } from '../utils/validation';

const validate = (values) =>
  onlyErrors({
    currentPassword: values.currentPassword ? '' : 'Current password is required',
    newPassword: validatePassword(values.newPassword),
    confirmPassword: values.confirmPassword === values.newPassword ? '' : 'Passwords do not match',
  });

export default function ChangePassword() {
  const { showToast } = useToast();
  const form = useForm({ currentPassword: '', newPassword: '', confirmPassword: '' }, validate);

  const onSubmit = form.handleSubmit(async ({ currentPassword, newPassword }) => {
    await authApi.changePassword({ currentPassword, newPassword });
    showToast('Password updated successfully');
    form.reset();
  });

  return (
    <div className="card form-card">
      <h1>Change Password</h1>

      {form.formError && <div className="alert alert-error">{form.formError}</div>}

      <form onSubmit={onSubmit} noValidate>
        <FormField label="Current password" name="currentPassword" type="password" value={form.values.currentPassword} onChange={form.handleChange} error={form.errors.currentPassword} autoComplete="current-password" />
        <FormField label="New password" name="newPassword" type="password" value={form.values.newPassword} onChange={form.handleChange} error={form.errors.newPassword} autoComplete="new-password" />
        <p className="hint">8 to 16 characters, with at least one uppercase letter and one special character.</p>
        <FormField label="Confirm new password" name="confirmPassword" type="password" value={form.values.confirmPassword} onChange={form.handleChange} error={form.errors.confirmPassword} autoComplete="new-password" />
        <button className="btn btn-primary" disabled={form.submitting}>
          {form.submitting ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
