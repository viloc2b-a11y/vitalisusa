/**
 * VITALIS CRM Adapter Layer (v1.0)
 * ─────────────────────────────────────────────────────────────────
 * Centralizes all CRM communication. Never call any CRM endpoint
 * directly from a form — always go through sendLeadToCRM().
 *
 * Design Principles:
 *  - Provider-agnostic: swap CRM by changing CRM_CONFIG.provider
 *  - Non-blocking: UX never waits for CRM response
 *  - Resilient: failures are logged + stored, never shown to user
 *  - Debug-friendly: verbose console output in non-production
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

// ══════════════════════════════════════════════════════════
// 1. CONFIG — Replace values in production via env injection
// ══════════════════════════════════════════════════════════
const CRM_CONFIG = {
    provider: 'kommo',                          // Swap to 'hubspot' | 'salesforce' | 'webhook' etc.
    kommo: {
        domain: 'REPLACE_WITH_YOUR_KOMMO_DOMAIN', // e.g. 'vilosite.kommo.com'
        token:  'REPLACE_IN_PRODUCTION',          // Long-lived OAuth2 Bearer token
        // Custom fields IDs — configure these in Kommo > Settings > Fields
        fields: {
            condition:       999001,              // Lead custom field: Condición
            score_label:     999002,              // Lead custom field: Score Label (A/B/C)
            score_value:     999003,              // Lead custom field: Score Numérico
            referral_source: 999004,              // Lead custom field: Fuente de Referido
            referral_code:   999005,              // Lead custom field: Código de Referido
            landing_url:     999006,              // Lead custom field: Landing URL
            campaign:        999007,              // Lead custom field: Campaña
            zip_code:        999008,              // Contact custom field: ZIP
            language:        999009,              // Contact custom field: Idioma
            lead_status:     999010,              // Lead custom field: Estado del Lead
        }
    }
    // Future CRM configs go here:
    // hubspot: { portalId: '...', formId: '...' },
    // webhook: { url: 'https://...' },
};

// ══════════════════════════════════════════════════════════
// 2. LEAD STATUS ENUM (ready for future status sync)
// ══════════════════════════════════════════════════════════
const LEAD_STATUS = {
    NEW:        'new',
    CONTACTED:  'contacted',
    QUALIFIED:  'qualified',
    SCREENING:  'screening',
    ENROLLED:   'enrolled',
    REJECTED:   'rejected'
};

// ══════════════════════════════════════════════════════════
// 3. LEAD DATA NORMALIZER
//    Converts raw form data into the canonical internal format.
//    All CRM adapters receive this standard object.
// ══════════════════════════════════════════════════════════

/**
 * buildLeadData(rawData, condition, scoreResult)
 *
 * @param {Object} rawData      - Form fields (from FormData or manual collection)
 * @param {string} condition    - e.g. 'rodillas' | 'diabetes' | 'ansiedad' ...
 * @param {Object} scoreResult  - { label: 'A'|'B'|'C', value: 0-100 }
 * @returns {Object} Canonical LeadData
 */
function buildLeadData(rawData, condition, scoreResult) {
    const referral_code   = localStorage.getItem('vit_referral_code')  || '';
    const referral_source = sessionStorage.getItem('referral_source_code')
                         || localStorage.getItem('vit_ref_source')     || '';

    const ld = {
        // ── Personal ──────────────────────────────────────────
        personal: {
            name:     (rawData.nombre    || rawData.name || '').trim(),
            phone:    (rawData.telefono  || rawData.phone || '').trim(),
            email:    (rawData.email     || '').trim(),
            city:     (rawData.ciudad    || 'Houston').trim(),
            zip:      (rawData.zip       || '').trim(),
            language: 'es'
        },
        // ── Clinical ──────────────────────────────────────────
        clinical: {
            condition:    condition || rawData.condition || 'general',
            symptoms:     rawData.sintoma       || rawData.nivel_dolor || '',
            diagnosis:    rawData.diagnostico   || rawData.tiene_dolor || '',
            medications:  rawData.tratamiento   || '',
            availability: rawData.disponibilidad || ''
        },
        // ── Scoring ───────────────────────────────────────────
        scoring: {
            label: scoreResult ? scoreResult.label : 'C',   // A / B / C
            value: scoreResult ? scoreResult.value : 0       // 0–100
        },
        // ── Source / Attribution ──────────────────────────────
        source: {
            landing:          window.location.pathname,
            campaign:         _getQueryParam('utm_campaign') || '',
            ad:               _getQueryParam('utm_content')  || '',
            channel:          _getQueryParam('utm_medium')   || _getQueryParam('utm_source') || 'organic',
            referral_source,
            referral_code
        },
        // ── Metadata ──────────────────────────────────────────
        metadata: {
            created_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
            page_url:   window.location.href,
            lead_id:    'VPL' + Date.now()
        },
        // ── Status (ready for future sync) ────────────────────
        status: LEAD_STATUS.NEW
    };

    console.log('[VITALIS CRM] Lead data built:', ld);
    return ld;
}

// ══════════════════════════════════════════════════════════
// 4. MAIN ROUTER — always call this, never a CRM fn directly
// ══════════════════════════════════════════════════════════

/**
 * sendLeadToCRM(leadData)
 * Fire-and-forget. Never blocks UX.
 *
 * @param {Object} leadData - canonical lead object from buildLeadData()
 */
function sendLeadToCRM(leadData) {
    // Save to localStorage as backup regardless of CRM outcome
    _saveLocalBackup(leadData);

    const provider = CRM_CONFIG.provider;

    if (provider === 'kommo') {
        return _sendToKommo(leadData);
    }
    // Future providers:
    // if (provider === 'hubspot')    return _sendToHubspot(leadData);
    // if (provider === 'webhook')    return _sendToWebhook(leadData);

    // Default: fallback log only
    return _sendToFallback(leadData, 'No provider configured');
}

// ══════════════════════════════════════════════════════════
// 5. KOMMO ADAPTER
// ══════════════════════════════════════════════════════════

function _transformToKommoFormat(ld) {
    const f = CRM_CONFIG.kommo.fields;
    const name = ld.personal.name || 'Lead sin nombre';
    const phone = ld.personal.phone || '';

    const payload = [
        {
            // ── LEAD ────────────────────────────────────────
            name: `[VITALIS] ${_conditionLabel(ld.clinical.condition)} — ${name}`,
            price: 0,
            status_id: 0,   // Default pipeline stage — configure in Kommo
            custom_fields_values: [
                { field_id: f.condition,       values: [{ value: ld.clinical.condition }] },
                { field_id: f.score_label,     values: [{ value: ld.scoring.label }] },
                { field_id: f.score_value,     values: [{ value: ld.scoring.value }] },
                { field_id: f.referral_source, values: [{ value: ld.source.referral_source }] },
                { field_id: f.referral_code,   values: [{ value: ld.source.referral_code }] },
                { field_id: f.landing_url,     values: [{ value: ld.source.landing }] },
                { field_id: f.campaign,        values: [{ value: ld.source.campaign }] },
                { field_id: f.lead_status,     values: [{ value: ld.status }] },
            ],
            // ── CONTACT ─────────────────────────────────────
            _embedded: {
                contacts: [
                    {
                        name,
                        first_name: name.split(' ')[0],
                        last_name:  name.split(' ').slice(1).join(' ') || '',
                        custom_fields_values: [
                            ...(phone ? [{ field_code: 'PHONE', values: [{ value: phone, enum_code: 'MOBILE' }] }] : []),
                            ...(ld.personal.email ? [{ field_code: 'EMAIL', values: [{ value: ld.personal.email, enum_code: 'WORK' }] }] : []),
                            { field_id: f.zip_code,  values: [{ value: ld.personal.zip }] },
                            { field_id: f.language,  values: [{ value: ld.personal.language }] },
                        ]
                    }
                ],
                // ── NOTE ────────────────────────────────────
                notes: [
                    {
                        note_type: 'common',
                        params: {
                            text: _buildKommoNote(ld)
                        }
                    }
                ]
            }
        }
    ];

    console.log('[VITALIS CRM] Kommo payload:', payload);
    return payload;
}

function _sendToKommo(leadData) {
    const cfg = CRM_CONFIG.kommo;

    // Guard: skip real fetch if token is placeholder (dev mode)
    if (!cfg.token || cfg.token === 'REPLACE_IN_PRODUCTION' || !cfg.domain || cfg.domain === 'REPLACE_WITH_YOUR_KOMMO_DOMAIN') {
        console.warn('[VITALIS CRM] Kommo token/domain not configured. Lead saved locally only.');
        return _sendToFallback(leadData, 'DEV_MODE — token not set');
    }

    const payload = _transformToKommoFormat(leadData);
    const url = `https://${cfg.domain}/api/v4/leads/complex`;

    fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${cfg.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    })
    .then(data => {
        console.log('[VITALIS CRM] ✅ Lead enviado a Kommo:', data);
        _markLocalBackupSent(leadData.metadata.lead_id);
    })
    .catch(err => {
        console.error('[VITALIS CRM] ❌ Error enviando a Kommo:', err);
        _sendToFallback(leadData, err.message);
    });
}

// ══════════════════════════════════════════════════════════
// 6. FALLBACK — Stores data for later retry, never surfaces error
// ══════════════════════════════════════════════════════════

function _sendToFallback(leadData, reason) {
    console.warn('[VITALIS CRM] Fallback activado. Razón:', reason);
    // Lead already saved in _saveLocalBackup(). Nothing more to do for now.
    // In production: POST to an internal endpoint / Supabase / Web3Forms here.
}

// ══════════════════════════════════════════════════════════
// 7. LOCAL BACKUP — localStorage safety net
// ══════════════════════════════════════════════════════════

function _saveLocalBackup(leadData) {
    try {
        const pending = JSON.parse(localStorage.getItem('vit_pending_leads') || '[]');
        // Deduplicate by lead_id
        const exists = pending.some(l => l.metadata && l.metadata.lead_id === leadData.metadata.lead_id);
        if (!exists) {
            pending.push({ ...leadData, _backup_status: 'pending' });
            localStorage.setItem('vit_pending_leads', JSON.stringify(pending));
        }
    } catch(e) {
        console.warn('[VITALIS CRM] Could not save local backup:', e);
    }
}

function _markLocalBackupSent(leadId) {
    try {
        const pending = JSON.parse(localStorage.getItem('vit_pending_leads') || '[]');
        const updated = pending.map(l =>
            l.metadata && l.metadata.lead_id === leadId
                ? { ...l, _backup_status: 'sent' }
                : l
        );
        localStorage.setItem('vit_pending_leads', JSON.stringify(updated));
    } catch(e) { /* silent */ }
}

// ══════════════════════════════════════════════════════════
// 8. HELPERS
// ══════════════════════════════════════════════════════════

function _getQueryParam(key) {
    return new URLSearchParams(window.location.search).get(key) || '';
}

function _conditionLabel(condition) {
    const labels = {
        rodillas:    'Dolor de Rodillas',
        'pap-anormal': 'Pap Anormal',
        ansiedad:    'Ansiedad',
        lupus:       'Lupus',
        diabetes:    'Diabetes',
        general:     'General'
    };
    return labels[condition] || condition;
}

function _buildKommoNote(ld) {
    return [
        `📋 VITALIS PORTAL — FICHA DE LEAD`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `👤 Nombre:        ${ld.personal.name}`,
        `📱 Teléfono:      ${ld.personal.phone}`,
        `📧 Email:         ${ld.personal.email || 'N/A'}`,
        `📍 ZIP:           ${ld.personal.zip || 'N/A'}`,
        `🏥 Condición:     ${_conditionLabel(ld.clinical.condition)}`,
        `🔬 Síntoma:       ${ld.clinical.symptoms}`,
        `💊 Diagnóstico:   ${ld.clinical.diagnosis}`,
        `⏰ Disponibilidad: ${ld.clinical.availability}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `📊 Score:         ${ld.scoring.label} (${ld.scoring.value}/100)`,
        `🌐 Landing:       ${ld.source.landing}`,
        `📣 Canal:         ${ld.source.channel}`,
        `🔗 Campaña:       ${ld.source.campaign || 'N/A'}`,
        `👥 Referido por:  ${ld.source.referral_source || 'Directo'}`,
        `🎫 Código ref:    ${ld.source.referral_code || 'N/A'}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🕐 Enviado:       ${ld.metadata.created_at}`,
        `🔑 ID interno:    ${ld.metadata.lead_id}`,
    ].join('\n');
}

// ══════════════════════════════════════════════════════════
// 9. PUBLIC API
// ══════════════════════════════════════════════════════════

window.VCrm = {
    sendLeadToCRM,
    buildLeadData,
    LEAD_STATUS,
    CRM_CONFIG  // Exposed for runtime config injection if needed
};
