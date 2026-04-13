import { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/components/_firma-dual.scss';

function FirmaCanvas({ initialDataUrl, onChange }) {
    const canvasRef = useRef(null);
    const isDrawing = useRef(false);
    const hasInitialized = useRef(false);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        const initCanvas = () => {
            if (hasInitialized.current) return;
            const rect = canvas.getBoundingClientRect();
            
            // Esperar activamente a que el canvas reciba su tamaño de CSS (>0)
            if (rect.width > 0 && rect.height > 0) {
                hasInitialized.current = true;
                
                canvas.width = rect.width * 2;
                canvas.height = rect.height * 2;
                ctx.scale(2, 2);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = '#1a1a1a';
                ctx.lineWidth = 2;

                if (initialDataUrl && initialDataUrl.length > 50) {
                    const img = new Image();
                    img.onload = () => {
                        ctx.drawImage(img, 0, 0, rect.width, rect.height);
                    };
                    img.src = initialDataUrl;
                }
            }
        };

        // ResizeObserver disparará automáticamente cuando el canvas deje de ser {width: 0}
        const ro = new ResizeObserver(() => {
            initCanvas();
        });
        ro.observe(canvas);

        const getPos = (e) => {
            const r = canvas.getBoundingClientRect();
            // Fallback preventivo
            if (r.width === 0) return { x: 0, y: 0 };
            
            const touch = e.touches ? e.touches[0] : e;
            return { x: touch.clientX - r.left, y: touch.clientY - r.top };
        };

        const startDraw = (e) => { 
            e.preventDefault(); 
            if (!hasInitialized.current) return;
            isDrawing.current = true; 
            const pos = getPos(e); 
            ctx.beginPath(); 
            ctx.moveTo(pos.x, pos.y); 
        };
        const draw = (e) => { 
            e.preventDefault(); 
            if (!isDrawing.current) return; 
            const pos = getPos(e); 
            ctx.lineTo(pos.x, pos.y); 
            ctx.stroke(); 
        };
        const endDraw = () => { 
            if (isDrawing.current) {
                isDrawing.current = false;
                onChangeRef.current(canvas.toDataURL('image/png'));
            }
        };

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', endDraw);
        canvas.addEventListener('mouseleave', endDraw);
        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', endDraw);

        return () => {
            ro.disconnect();
            canvas.removeEventListener('mousedown', startDraw);
            canvas.removeEventListener('mousemove', draw);
            canvas.removeEventListener('mouseup', endDraw);
            canvas.removeEventListener('mouseleave', endDraw);
            canvas.removeEventListener('touchstart', startDraw);
            canvas.removeEventListener('touchmove', draw);
            canvas.removeEventListener('touchend', endDraw);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '140px', border: '2px dashed #e2e8f0', borderRadius: '8px', touchAction: 'none' }} />;
}

function FirmaDualModal({ onConfirm, onClose, submitting }) {
    // Sección abierta: 'cliente' | 'representante'
    const [seccionAbierta, setSeccionAbierta] = useState('cliente');

    // Estado cliente
    const [firmaClienteBase64, setFirmaClienteBase64] = useState(null);
    const [clearClienteKey, setClearClienteKey] = useState(0);
    const [emailCliente, setEmailCliente] = useState('');
    const [nombreCliente, setNombreCliente] = useState('');
    const [codigoPais, setCodigoPais] = useState('+54');
    const [prefijo, setPrefijo] = useState('');
    const [numero, setNumero] = useState('');

    // Estado representante
    const [firmaRepBase64, setFirmaRepBase64] = useState(null);
    const [clearRepKey, setClearRepKey] = useState(0);
    const [nombreRep, setNombreRep] = useState('');

    const limpiarCliente = () => {
        setFirmaClienteBase64(null);
        setClearClienteKey(prev => prev + 1);
    };

    const limpiarRep = () => {
        setFirmaRepBase64(null);
        setClearRepKey(prev => prev + 1);
    };

    const telefonoValido = numero.length === 0 || (codigoPais.length > 0 && prefijo.length > 0 && numero.length >= 8);
    const emailValido = emailCliente.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCliente);
    const tieneContactoCliente = numero.length >= 8 || (emailCliente.trim() !== '' && emailValido);

    const puedeConfirmar = firmaClienteBase64 && firmaRepBase64 && nombreRep.trim().length > 0 && tieneContactoCliente && !submitting;

    const handleConfirmar = () => {
        if (!puedeConfirmar) return;

        const codigoPaisLimpio = codigoPais.replace(/[^\d]/g, '');
        const telefonoCompleto = numero.length >= 8 ? `${codigoPaisLimpio}${prefijo}${numero}` : null;

        onConfirm({
            firma_base64: firmaClienteBase64,
            firma_representante_base64: firmaRepBase64,
            nombre_representante: nombreRep.trim(),
            cliente_nombre: nombreCliente.trim() || null,
            email_cliente: emailCliente.trim() || null,
            cliente_numero: telefonoCompleto,
        });
    };

    return (
        <div className="firma-dual-overlay">
            <div className="firma-dual-modal">
                <div className="firma-dual-header">
                    <h2>✍️ Firmar contrato</h2>
                    <p>Se requieren las firmas del cliente y del representante</p>
                </div>

                {/* Sección cliente */}
                <div className={`firma-dual-section ${seccionAbierta === 'cliente' ? 'active' : ''}`}>
                    <div
                        className="firma-dual-section-header"
                        onClick={() => setSeccionAbierta(seccionAbierta === 'cliente' ? null : 'cliente')}
                    >
                        <span className="section-title">
                            👤 Firma del cliente
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`section-status ${firmaClienteBase64 && tieneContactoCliente ? 'done' : 'pending'}`}>
                                {firmaClienteBase64 && tieneContactoCliente ? '✓ Listo' : 'Pendiente'}
                            </span>
                            <span className={`section-chevron ${seccionAbierta === 'cliente' ? 'open' : ''}`}>▾</span>
                        </div>
                    </div>

                    {seccionAbierta === 'cliente' && (
                        <div className="firma-dual-section-body">
                            <div className="canvas-container">
                                <div className="canvas-label">
                                    <span>Firma aquí</span>
                                    <button onClick={limpiarCliente}>Limpiar</button>
                                </div>
                                <FirmaCanvas key={`cliente-${clearClienteKey}`} initialDataUrl={firmaClienteBase64} onChange={setFirmaClienteBase64} />
                            </div>

                            <div className="firma-input-group">
                                <label>Nombre del cliente</label>
                                <input
                                    type="text"
                                    placeholder="Nombre y apellido"
                                    value={nombreCliente}
                                    onChange={(e) => setNombreCliente(e.target.value)}
                                />
                            </div>

                            <div className="firma-input-group">
                                <label>📱 Teléfono</label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input
                                        type="text"
                                        placeholder="+54"
                                        value={codigoPais}
                                        onChange={(e) => setCodigoPais(e.target.value.replace(/[^\d+]/g, '').slice(0, 5))}
                                        style={{ width: '72px', textAlign: 'center' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="11"
                                        value={prefijo}
                                        onChange={(e) => setPrefijo(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        style={{ width: '64px', textAlign: 'center' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="65432100"
                                        value={numero}
                                        onChange={(e) => setNumero(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    />
                                </div>
                            </div>

                            <div className="firma-input-group">
                                <label>📧 Email (opcional)</label>
                                <input
                                    type="email"
                                    placeholder="cliente@email.com"
                                    value={emailCliente}
                                    onChange={(e) => setEmailCliente(e.target.value)}
                                />
                            </div>

                            {firmaClienteBase64 && tieneContactoCliente && (
                                <button
                                    style={{
                                        width: '100%', padding: '10px', background: '#F0FDF4',
                                        border: '1.5px solid #16A34A', borderRadius: '10px',
                                        color: '#16A34A', fontWeight: 600, fontSize: '0.875rem',
                                        cursor: 'pointer', fontFamily: 'inherit',
                                    }}
                                    onClick={() => setSeccionAbierta('representante')}
                                >
                                    Continuar con firma del representante →
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Sección representante */}
                <div className={`firma-dual-section ${seccionAbierta === 'representante' ? 'active' : ''}`}>
                    <div
                        className="firma-dual-section-header"
                        onClick={() => setSeccionAbierta(seccionAbierta === 'representante' ? null : 'representante')}
                    >
                        <span className="section-title">
                            🏢 Firma del representante
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`section-status ${firmaRepBase64 && nombreRep.trim() ? 'done' : 'pending'}`}>
                                {firmaRepBase64 && nombreRep.trim() ? '✓ Listo' : 'Pendiente'}
                            </span>
                            <span className={`section-chevron ${seccionAbierta === 'representante' ? 'open' : ''}`}>▾</span>
                        </div>
                    </div>

                    {seccionAbierta === 'representante' && (
                        <div className="firma-dual-section-body">
                            <div className="canvas-container">
                                <div className="canvas-label">
                                    <span>Firma aquí</span>
                                    <button onClick={limpiarRep}>Limpiar</button>
                                </div>
                                <FirmaCanvas key={`rep-${clearRepKey}`} initialDataUrl={firmaRepBase64} onChange={setFirmaRepBase64} />
                            </div>

                            <div className="firma-input-group">
                                <label>Nombre del representante *</label>
                                <input
                                    type="text"
                                    placeholder="Tu nombre completo"
                                    value={nombreRep}
                                    onChange={(e) => setNombreRep(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="firma-dual-actions">
                    <button
                        className="btn-firma-confirm"
                        onClick={handleConfirmar}
                        disabled={!puedeConfirmar}
                    >
                        {submitting ? 'Procesando firmas...' : '✅ Confirmar y firmar contrato'}
                    </button>
                    <button className="btn-firma-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FirmaDualModal;
