// <AuthScreen> — onglets Connexion / Inscription, appelle StockDex.api,
// remonte le user via onAuth(user).

(() => {
  const { useState, useRef, useEffect } = React;
  const api = window.StockDex.api;

  // Validation côté client identique au backend pour éviter un aller-retour
  // visible et donner un feedback immédiat.
  const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,24}$/;
  const PASSWORD_MIN = 6;

  function AuthScreen({ onAuth }) {
    const [mode, setMode]         = useState('login'); // 'login' | 'register'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState(null);

    const usernameRef = useRef(null);
    useEffect(() => { usernameRef.current?.focus(); }, [mode]);

    const switchMode = (next) => {
      setError(null);
      setPassword('');
      setMode(next);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError(null);

      if (!USERNAME_RE.test(username)) {
        setError('Nom d\u2019utilisateur invalide (3 à 24 caractères, lettres/chiffres/._-).');
        return;
      }
      if (password.length < PASSWORD_MIN) {
        setError(`Le mot de passe doit faire au moins ${PASSWORD_MIN} caractères.`);
        return;
      }

      setLoading(true);
      try {
        const user = mode === 'login'
          ? await api.login({ username, password })
          : await api.register({ username, password });
        onAuth(user);
      } catch (err) {
        setError(err.message || 'Erreur inattendue. Réessayez.');
      } finally {
        setLoading(false);
      }
    };

    const submitLabel = mode === 'login' ? 'Se connecter' : 'Créer mon compte';

    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand">
            <h1 className="auth-brand-name">StockDex</h1>
            <p className="auth-brand-tagline">La bourse fictive en cartes à collectionner.</p>
          </div>

          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >Connexion</button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >Inscription</button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="auth-username">Nom d'utilisateur</label>
              <input
                id="auth-username"
                ref={usernameRef}
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                spellCheck={false}
                placeholder="ex. paul_dev"
              />
              {mode === 'register' && (
                <span className="hint">3 à 24 caractères — lettres, chiffres, point, tiret, underscore.</span>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">Mot de passe</label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="\u2022\u2022\u2022\u2022\u2022\u2022"
              />
              {mode === 'register' && (
                <span className="hint">Au moins 6 caractères.</span>
              )}
            </div>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button
              type="submit"
              className="btn btn-gold auth-submit"
              disabled={loading}
            >{loading ? 'Patientez\u2026' : submitLabel}</button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? "Pas encore de compte ?" : 'Déjà un compte ?'}
            <button
              type="button"
              className="link-btn"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              disabled={loading}
            >{mode === 'login' ? 'Créer un compte' : 'Se connecter'}</button>
          </p>
        </div>
      </div>
    );
  }

  // Expose globalement, comme les autres screens
  window.AuthScreen = AuthScreen;
})();
