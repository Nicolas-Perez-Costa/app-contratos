import { useState } from 'react';

function UpgradeModal({ onClose, tipo = 'contratos' }) {
    const [upgrading, setUpgrading] = useState(null);

    const mensajes = {
        contratos: {
            titulo: '¡Límite de Contratos Alcanzado!',
            subtitulo: 'Has alcanzado el máximo de 15 contratos mensuales en el plan Gratuito.',
        },
        plantillas: {
            titulo: '¡Límite de Plantillas Alcanzado!',
            subtitulo: 'Has alcanzado el máximo de 2 plantillas en el plan Gratuito.',
        },
    };

    const msg = mensajes[tipo] || mensajes.contratos;

    const handleUpgrade = async (plan) => {
        setUpgrading(plan);
        try {
            const res = await fetch('/api/suscripciones/crear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ plan }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Error al crear la suscripción.');
                return;
            }

            window.location.href = data.init_point;
        } catch (err) {
            alert('Error de conexión. Intenta de nuevo.');
        } finally {
            setUpgrading(null);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-icon">🚀</div>
                    <h2>{msg.titulo}</h2>
                    <p>{msg.subtitulo}</p>
                </div>

                <div className="modal-body">
                    <ul className="upgrade-features">
                        <li>✅ Plantillas ilimitadas</li>
                        <li>✅ Contratos ilimitados por mes</li>
                        <li>✅ Marca blanca en PDFs y correos</li>
                        <li>✅ Soporte prioritario</li>
                    </ul>
                </div>

                <div className="modal-actions">
                    <button
                        className="btn-modal-primary"
                        onClick={() => handleUpgrade('pro')}
                        disabled={upgrading !== null}
                    >
                        {upgrading === 'pro' ? 'Redirigiendo a MercadoPago...' : '✨ Plan Pro — $8.000/mes'}
                    </button>
                    <button
                        className="btn-modal-primary empresa"
                        onClick={() => handleUpgrade('empresa')}
                        disabled={upgrading !== null}
                        style={{ background: '#1565C0', marginTop: '8px' }}
                    >
                        {upgrading === 'empresa' ? 'Redirigiendo a MercadoPago...' : '🏢 Plan Empresa — $25.000/mes'}
                    </button>
                    <button className="btn-modal-secondary" onClick={onClose}>
                        Ahora no
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UpgradeModal;
