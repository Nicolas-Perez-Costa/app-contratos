import { useEffect, useRef, useState, useCallback } from 'react';
import '../styles/components/_camera-modal.scss';

function CameraModal({ onCapture, onClose }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' = trasera, 'user' = frontal
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [tieneDualCamara, setTieneDualCamara] = useState(false);

    // Detectar si el dispositivo tiene más de una cámara
    const detectarCamaras = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const camaras = devices.filter((d) => d.kind === 'videoinput');
            setTieneDualCamara(camaras.length > 1);
        } catch {
            setTieneDualCamara(false);
        }
    }, []);

    // Iniciar stream de cámara
    const iniciarCamara = useCallback(async (facing) => {
        // Detener stream anterior si existe
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        setCargando(true);
        setError(null);

        try {
            const constraints = {
                video: {
                    facingMode: { ideal: facing },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setCargando(false);
        } catch (err) {
            setCargando(false);
            if (err.name === 'NotAllowedError') {
                setError({
                    titulo: 'Permiso denegado',
                    mensaje: 'Para usar la cámara, habilitá el permiso en la configuración de tu navegador y recargá la página.',
                });
            } else if (err.name === 'NotFoundError') {
                setError({
                    titulo: 'Cámara no encontrada',
                    mensaje: 'No se detectó ninguna cámara en este dispositivo.',
                });
            } else {
                setError({
                    titulo: 'Error al acceder a la cámara',
                    mensaje: 'Intentá cerrar otras apps que estén usando la cámara y volvé a intentarlo.',
                });
            }
        }
    }, []);

    // Montar: iniciar cámara trasera por defecto
    useEffect(() => {
        detectarCamaras();
        iniciarCamara('environment');

        return () => {
            // Cleanup: detener stream al desmontar
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    // Cambiar cámara
    const cambiarCamara = () => {
        const nuevaFacing = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(nuevaFacing);
        iniciarCamara(nuevaFacing);
    };

    // Capturar foto del video
    const capturarFoto = () => {
        if (!videoRef.current || cargando || error) return;

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');

        // Espejo horizontal si es cámara frontal
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
            (blob) => {
                const handleBlob = (b) => {
                    const file = new File([b], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    // Detener stream antes de cerrar
                    if (streamRef.current) {
                        streamRef.current.getTracks().forEach((track) => track.stop());
                    }
                    onCapture(file);
                };

                if (!blob) {
                    // Fallback
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                    fetch(dataUrl).then(r => r.blob()).then(handleBlob);
                } else {
                    handleBlob(blob);
                }
            },
            'image/jpeg',
            0.92
        );
    };

    // Cerrar modal y detener stream
    const handleClose = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
        onClose();
    };

    return (
        <div className="camera-overlay">
            {/* Header */}
            <div className="camera-header">
                <span className="camera-title">📷 Tomar foto</span>
                <button className="camera-close-btn" onClick={handleClose} aria-label="Cerrar cámara">
                    ✕
                </button>
            </div>

            {/* Video / Estado */}
            <div className="camera-video-wrapper">
                {cargando && !error && (
                    <div className="camera-loading">
                        <span style={{ fontSize: '2rem' }}>⏳</span>
                        <p>Iniciando cámara...</p>
                    </div>
                )}

                {error && (
                    <div className="camera-error">
                        <span className="error-icon">📵</span>
                        <h3>{error.titulo}</h3>
                        <p>{error.mensaje}</p>
                    </div>
                )}

                <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    style={{
                        display: cargando || error ? 'none' : 'block',
                        // Espejo visual si es cámara frontal
                        transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                    }}
                />
            </div>

            {/* Footer con controles */}
            <div className="camera-footer">
                {/* Botón girar cámara */}
                <button
                    className="camera-flip-btn"
                    onClick={cambiarCamara}
                    disabled={!tieneDualCamara || cargando || !!error}
                    aria-label="Cambiar cámara"
                    title={tieneDualCamara ? 'Cambiar cámara' : 'Este dispositivo tiene una sola cámara'}
                >
                    🔄
                </button>

                {/* Botón capturar */}
                <button
                    className="camera-capture-btn"
                    onClick={capturarFoto}
                    disabled={cargando || !!error}
                    aria-label="Tomar foto"
                >
                    <div className="capture-inner" />
                </button>

                {/* Espaciador para centrar el botón de captura */}
                <div className="camera-spacer" />
            </div>
        </div>
    );
}

export default CameraModal;
