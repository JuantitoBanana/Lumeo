import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ResetPasswordWeb() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    // Verificar si hay un token válido en la URL
    const checkToken = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && type === 'recovery') {
        try {
          // Establecer la sesión con el token de recuperación
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            setError('El enlace de recuperación no es válido o ha expirado.');
          } else {
            setValidToken(true);
          }
        } catch (err) {
          setError('Ha ocurrido un error al verificar el enlace.');
        }
      } else {
        setError('Enlace de recuperación no válido.');
      }
    };

    checkToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Por favor, rellena todos los campos');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Cerrar sesión después de cambiar la contraseña
        setTimeout(() => {
          supabase.auth.signOut();
        }, 3000);
      }
    } catch (err) {
      setError('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!validToken && !error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Verificando enlace...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h1 style={styles.title}>¡Contraseña actualizada!</h1>
          <p style={styles.successText}>
            Tu contraseña ha sido actualizada correctamente.
            <br />
            Ya puedes iniciar sesión en la aplicación con tu nueva contraseña.
          </p>
        </div>
      </div>
    );
  }

  if (error && !validToken) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>✕</div>
          <h1 style={styles.title}>Enlace no válido</h1>
          <p style={styles.errorText}>{error}</p>
          <p style={styles.infoText}>
            Por favor, solicita un nuevo enlace de recuperación desde la aplicación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Restablecer contraseña</h1>
          <p style={styles.subtitle}>Introduce tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorAlert}>
              {error}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label htmlFor="newPassword" style={styles.label}>
              Nueva contraseña
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Introduce tu nueva contraseña"
              style={styles.input}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu nueva contraseña"
              style={styles.input}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
            disabled={loading}
          >
            {loading ? 'Cambiando contraseña...' : 'Cambiar contraseña'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>Lumeo © 2025</p>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #007AFF 0%, #0051D5 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    padding: '48px',
    maxWidth: '480px',
    width: '100%',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    padding: '14px 16px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: '#f9f9f9',
  },
  button: {
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#007AFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '8px',
  },
  buttonDisabled: {
    backgroundColor: '#99c7ff',
    cursor: 'not-allowed',
  },
  errorAlert: {
    padding: '12px 16px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    color: '#c33',
    fontSize: '14px',
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '14px',
    color: '#999',
    margin: 0,
  },
  successIcon: {
    fontSize: '64px',
    color: '#34C759',
    textAlign: 'center',
    marginBottom: '24px',
  },
  successText: {
    fontSize: '16px',
    color: '#666',
    textAlign: 'center',
    lineHeight: '1.5',
  },
  errorIcon: {
    fontSize: '64px',
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: '24px',
  },
  errorText: {
    fontSize: '16px',
    color: '#c33',
    textAlign: 'center',
    marginBottom: '16px',
  },
  infoText: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    margin: '0 auto 20px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #007AFF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: '16px',
  },
};

// Añadir la animación del spinner
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    input:focus {
      border-color: #007AFF !important;
      background-color: #fff !important;
    }
    
    button:hover:not(:disabled) {
      background-color: #0051D5 !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
