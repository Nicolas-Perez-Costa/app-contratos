import { useState, useEffect } from 'react';

const ACCION_CONFIG = {
    creado: { icon: '📄', label: 'Contrato creado', color: '#16A34A' },
    editado: { icon: '✏️', label: 'Contrato editado', color: '#D97706' },
    firmado: { icon: '✍️', label: 'Contrato firmado', color: '#2563EB' },
    pdf_descargado: { icon: '⬇️', label: 'PDF descargado', color: '#7C3AED' },
    eliminado: { icon: '🗑️', label: 'Contrato eliminado', color: '#DC2626' },
};

function ContratoLogModal({ contrato, onClose }) {
    const [log, setLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLog();
    }, []);

    const fetchLog = async () => {
        try {
            const res = await fetch(`/api/contratos/${contrato.id_contrato}/log`, {
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Error al cargar el historial.');
            const data = await res.json();
            setLog(data.log);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatFecha = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-icon">🕐</div>
                    <h2>Historial del contrato</h2>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '4px' }}>
                        {contrato.titulo_contrato}
                    </p>
                </div>

                <div className="modal-body">
                    {loading && (
                        <p style={{ textAlign: 'center', color: '#9CA3AF' }}>Cargando...</p>
                    )}

                    {error && (
                        <p style={{ textAlign: 'center', color: '#DC2626' }}>{error}</p>
                    )}

                    {!loading && !error && log.length === 0 && (
                        <p style={{ textAlign: 'center', color: '#9CA3AF' }}>
                            Sin actividad registrada.
                        </p>
                    )}

                    {!loading && !error && log.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {log.map((entry) => {
                                const config = ACCION_CONFIG[entry.accion] || {
                                    icon: '•',
                                    label: entry.accion,
                                    color: '#6B7280',
                                };
                                return (
                                    <div
                                        key={entry.id}
                                        style={{
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'flex-start',
                                            padding: '12px',
                                            background: '#F9F9F6',
                                            borderRadius: '10px',
                                            border: '1px solid #E5E7EB',
                                        }}
                                    >
                                        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                                            {config.icon}
                                        </span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                                color: config.color,
                                            }}>
                                                {config.label}
                                            </div>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: '#6B7280',
                                                marginTop: '2px',
                                            }}>
                                                {formatFecha(entry.created_at)}
                                            </div>
                                            {entry.accion === 'firmado' && entry.metadata?.email_cliente && (
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: '#9CA3AF',
                                                    marginTop: '2px',
                                                }}>
                                                    Cliente: {entry.metadata.email_cliente}
                                                </div>
                                            )}
                                            {entry.accion === 'eliminado' && entry.metadata?.titulo && (
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: '#9CA3AF',
                                                    marginTop: '2px',
                                                }}>
                                                    Título: {entry.metadata.titulo}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="btn-modal-secondary" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ContratoLogModal;
