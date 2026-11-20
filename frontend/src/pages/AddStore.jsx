import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/endpoints';
import { useToast } from '../context/ToastContext';
import useForm from '../hooks/useForm';
import FormField from '../components/FormField';
import { onlyErrors, validateAddress, validateEmail, validateStoreName } from '../utils/validation';

const validate = (values) =>
  onlyErrors({
    name: validateStoreName(values.name),
    email: validateEmail(values.email),
    address: validateAddress(values.address),
  });

export default function AddStore() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [owners, setOwners] = useState([]);
  const form = useForm({ name: '', email: '', address: '', ownerId: '' }, validate);

  // Only owners who do not have a store yet can be picked.
  useEffect(() => {
    adminApi.availableOwners().then((res) => setOwners(res.owners)).catch(() => {});
  }, []);

  const onSubmit = form.handleSubmit(async (values) => {
    await adminApi.createStore(values);
    showToast('Store added successfully');
    navigate('/admin/stores');
  });

  return (
    <div className="card form-card">
      <h1>Add Store</h1>

      {form.formError && <div className="alert alert-error">{form.formError}</div>}

      <form onSubmit={onSubmit} noValidate>
        <FormField label="Store name" name="name" value={form.values.name} onChange={form.handleChange} error={form.errors.name} />
        <FormField label="Store email" name="email" type="email" value={form.values.email} onChange={form.handleChange} error={form.errors.email} />
        <FormField label="Address (max 400 characters)" name="address" as="textarea" rows={3} value={form.values.address} onChange={form.handleChange} error={form.errors.address} />
        <FormField label="Store owner (optional)" name="ownerId" as="select" value={form.values.ownerId} onChange={form.handleChange} error={form.errors.ownerId}>
          <option value="">No owner yet</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>{owner.name} ({owner.email})</option>
          ))}
        </FormField>
        {owners.length === 0 && (
          <p className="hint">No free store owners. Create a user with the "Store Owner" role first to assign one.</p>
        )}
        <button className="btn btn-primary" disabled={form.submitting}>
          {form.submitting ? 'Saving...' : 'Add store'}
        </button>
      </form>
    </div>
  );
}
