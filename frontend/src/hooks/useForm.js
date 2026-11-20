import { useState } from 'react';
import { getErrorMessage, getFieldErrors } from '../services/api';

// Small helper shared by all forms.
//  - validate(values) must return { field: message } (empty object = valid)
//  - handleSubmit(onValid) runs frontend validation first, then your API call.
//    If the backend rejects the data, its field errors are shown under the inputs.
export default function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' })); // clear the error while typing
  }

  function reset() {
    setValues(initialValues);
    setErrors({});
    setFormError('');
  }

  function handleSubmit(onValid) {
    return async (event) => {
      event.preventDefault();
      setFormError('');

      const foundErrors = validate(values);
      setErrors(foundErrors);
      if (Object.keys(foundErrors).length > 0) return;

      setSubmitting(true);
      try {
        await onValid(values);
      } catch (err) {
        const fieldErrors = getFieldErrors(err);
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length === 0) setFormError(getErrorMessage(err));
      } finally {
        setSubmitting(false);
      }
    };
  }

  return { values, errors, formError, submitting, handleChange, handleSubmit, reset };
}
