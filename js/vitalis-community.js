/**
 * VITALIS Community Logic (v1.0)
 * Logic for referrals, points, levels, and WhatsApp sharing.
 */

const VC = (function() {
    'use strict';

    // Levels definitions
    const LEVELS = {
        PARTICIPANTE: { id: 1, name: 'Participante', min: 0, points: 50, color: '#1a6fc4', icon: '👤' },
        AMIGO: { id: 2, name: 'Amigo Vitalis', min: 3, points: 150, color: '#e8622a', icon: '🤝' },
        EMBAJADOR: { id: 3, name: 'Embajador Vitalis', min: 10, points: 500, color: '#2a9d8f', icon: '🌟' }
    };

    // Initial state
    const DEFAULT_USER = {
        name: 'Paciente Demo',
        points: 0,
        referrals: [], // Array of lead objects or IDs
        level: LEVELS.PARTICIPANTE,
        referral_code: 'VPL' + Math.random().toString(36).substr(2, 6).toUpperCase()
    };

    // STORAGE Functions
    const getState = () => {
        const saved = localStorage.getItem('vitalis_community_user');
        if (!saved) {
            localStorage.setItem('vitalis_community_user', JSON.stringify(DEFAULT_USER));
            return DEFAULT_USER;
        }
        return JSON.parse(saved);
    };

    const saveState = (state) => {
        localStorage.setItem('vitalis_community_user', JSON.stringify(state));
    };

    // LOGIC Functions
    const addPoints = (amount) => {
        const state = getState();
        state.points += amount;
        
        // Recalculate level
        const count = state.referrals.length;
        if (count >= LEVELS.EMBAJADOR.min) state.level = LEVELS.EMBAJADOR;
        else if (count >= LEVELS.AMIGO.min) state.level = LEVELS.AMIGO;
        else state.level = LEVELS.PARTICIPANTE;

        saveState(state);
    };

    const registerReferral = (leadData) => {
        const state = getState();
        const newReferral = {
            id: 'REF_' + Date.now(),
            date: new Date().toISOString(),
            name: leadData.name || 'Anónimo',
            condition: leadData.condition || 'No especificada',
            status: 'pendiente'
        };
        state.referrals.push(newReferral);
        saveState(state);
        addPoints(50); // Points for each referral
    };

    const getShareMessage = (condition = '') => {
        const state = getState();
        const code = state.referral_code;
        const baseUrl = window.location.origin + window.location.pathname.split('/').slice(0,-1).join('/');
        const link = `${baseUrl}/index.html?ref=${code}`;
        
        let text = `Hola, encontré una opción médica gratuita en Houston que podría interesarte. Me gustó porque atienden todo en español. Checa si calificas aquí: ${link}`;
        
        if (condition.includes('rodilla')) text = `Hola, sé que te duelen las rodillas. Mira esta opción médica gratuita en Houston con apoyo en español: ${link}`;
        else if (condition.includes('ansiedad')) text = `Hola, si te has sentido ansioso o con problemas de sueño, encontré esta opción gratuita en Houston totalmente en español: ${link}`;
        else if (condition.includes('lupus')) text = `Mira esta opción para personas con Lupus en Houston. Es gratuita y la atención es en español: ${link}`;
        
        return encodeURIComponent(text);
    };

    // UI Injections
    const injectLandingShare = (selector, condition = '') => {
        const target = document.querySelector(selector);
        if (!target) return;

        const state = getState();
        const msg = getShareMessage(condition);
        const waLink = `https://wa.me/?text=${msg}`;

        const html = `
            <div class="community-share-strip">
                <div class="container css-inner">
                    <div class="css-text">
                        <h4>¿Conoces a alguien más que necesite esta ayuda?</h4>
                        <p>Tu familia y amigos también merecen opciones médicas de calidad en español.</p>
                    </div>
                    <div class="css-actions">
                        <a href="${waLink}" target="_blank" class="vc-btn-wa">
                            <i class="fab fa-whatsapp"></i> Compartir con mi familia
                        </a>
                        <button onclick="window.VC.copyReferralLink()" class="vc-btn-copy">
                            <i class="far fa-copy"></i> Copiar link
                        </button>
                    </div>
                    <p class="css-disclaimer">VITALIS reconoce tu esfuerzo por ayudar a la comunidad. No garantizamos resultados médicos ni participación directa.</p>
                </div>
            </div>
        `;
        target.insertAdjacentHTML('beforeend', html);
    };

    const copyReferralLink = () => {
        const state = getState();
        const code = state.referral_code;
        const baseUrl = window.location.origin + window.location.pathname.split('/').slice(0,-1).join('/');
        const link = `${baseUrl}/index.html?ref=${code}`;
        
        navigator.clipboard.writeText(link).then(() => {
            alert('¡Link de referido copiado! Compártelo con quien desees ayudar.');
        });
    };

    // Initialize
    const init = () => {
        // Detect referral code in URL
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) {
            sessionStorage.setItem('referral_source_code', ref);
        }
    };

    init();

    return {
        getState,
        addPoints,
        registerReferral,
        injectLandingShare,
        getShareMessage,
        copyReferralLink
    };
})();

window.VC = VC;
