import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/_onboarding.scss';

const STEPS = [
    {
        icon: '📋',
        title: '¡Bienvenido a ContratosAgiles!',
        description: 'En 3 pasos te explicamos cómo proteger tu trabajo con contratos firmados en el momento.',
        tip: '💡 Miles de técnicos y profesionales usan ContratosAgiles para tener respaldo legal si un cliente reclama algo después del trabajo.',
        action: 'Empezar →',
    },
    {
        icon: '🗂️',
        title: 'Primero: creá tu plantilla',
        description: 'Una plantilla es el modelo de contrato que vas a usar siempre. La armás una vez con los campos que necesitás: descripción del trabajo, precio, fotos del estado inicial. Después la reutilizás con cada cliente.',
        tip: '💡 Podés agregar bloques de texto fijo (las condiciones) y campos dinámicos (nombre del cliente, precio del trabajo, fotos).',
        action: 'Crear mi primera plantilla →',
        navigate: '/plantilla/nueva',
    },
    {
        icon: '✍️',
        title: 'Después: generá el contrato y pedí la firma',
        description: 'Cuando estés con el cliente, generás el contrato desde tu plantilla, completás los datos del momento, sacás las fotos, y el cliente firma con el dedo en tu celular. Los dos se van con el respaldo.',
        tip: '💡 El cliente puede recibir el PDF firmado por WhatsApp o email. Vos lo tenés guardado en tu cuenta para siempre.',
        action: 'Entendido, vamos →',
        finish: true,
    },
];

function OnboardingWizard({ onComplete }) {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const currentStep = STEPS[step];
    const isLast = step === STEPS.length - 1;

    const marcarCompletado = async () => {
        try {
            await fetch('/api/auth/onboarding-completado', {
                method: 'POST',
                credentials: 'include',
            });
        } catch (err) {
            // No bloquear el flujo si falla
        }
    };

    const handleAction = async () => {
        if (currentStep.navigate) {
            setLoading(true);
            await marcarCompletado();
            navigate(currentStep.navigate);
            return;
        }

        if (currentStep.finish || isLast) {
            setLoading(true);
            await marcarCompletado();
            onComplete();
            return;
        }

        setStep((prev) => prev + 1);
    };

    const handleSkip = async () => {
        await marcarCompletado();
        onComplete();
    };

    return (
        <div className="onboarding-overlay">
            <div className="onboarding-modal">
                <div className="onboarding-header">
                    <div className="onboarding-step-indicator">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                            />
                        ))}
                    </div>
                    <span className="onboarding-icon">{currentStep.icon}</span>
                    <h2>{currentStep.title}</h2>
                    <p>{currentStep.description}</p>
                </div>

                <div className="onboarding-content">
                    <div className="onboarding-tip">
                        <span className="tip-icon">💡</span>
                        <span>{currentStep.tip.replace('💡 ', '')}</span>
                    </div>
                </div>

                <div className="onboarding-actions">
                    <button
                        className="btn-onboarding-primary"
                        onClick={handleAction}
                        disabled={loading}
                    >
                        {loading ? 'Cargando...' : currentStep.action}
                    </button>
                    {!isLast && !currentStep.finish && (
                        <button className="btn-onboarding-skip" onClick={handleSkip}>
                            Saltar por ahora
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OnboardingWizard;
