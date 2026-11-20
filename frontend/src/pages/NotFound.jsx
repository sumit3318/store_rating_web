import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>404</h1>
        <p>The page you are looking for does not exist.</p>
        <Link className="btn btn-primary" to="/">Go to home</Link>
      </div>
    </div>
  );
}
