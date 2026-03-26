/**
 * VITALIS CRM Adapter + Automation Layer (v2.0)
 * ─────────────────────────────────────────────────────────────────────
 * Centralizes ALL CRM communication and pipeline automation.
 * Never call any CRM endpoint directly from a form or page.
 * Always use sendLeadToCRM() → runAutomationAfterCRM().
 *
 * Design Principles:
 *  - Provider-agnostic: swap CRM by changing CRM_CONFIG.provider
 *  - Non-blocking: UX never waits for CRM. sendLeadToCRM() returns Promise.
 *  - Resilient: failures logged + stored in localStorage, never shown to user
 *  - Automation-ready: tasks, followup, and stage updates built-in
 *  - Debug-friendly: structured event log via logVitalisEvent()
 * ─────────────────────────────────────────────────────────────────────
 */

'use strict';

// ══════════════════════════════════════════════════════════
// 1. CONFIG — Replace values in production via env injection
// ══════════════════════════════════════════════════════════
const CRM_CONFIG = {
    provider:        'kommo',
    debug:           true,
    fallbackEnabled: true,
    kommo: {
        domain: 'REPLACE_WITH_YOUR_KOMMO_DOMAIN', // e.g. 'vilosite.kommo.com'
        token:  'REPLACE_IN_PRODUCTION',           // Long-lived OAuth2 Bearer token
        pipeline: 'Reclutamiento VITALIS',
        // Custom field IDs — configure in Kommo > Settings > Fields
        fields: {
            condition:       999001,
            score_label:     999002,
            score_value:     999003,
            referral_source: 999004,
            referral_code:   999005,
            landing_url:     999006,
            campaign:        999007,
            zip_code:        999008,
            language:        999009,
            lead_status:     999010,
            urgency:         999011,
            owner_name:      999012,
        }
    }
    // Future providers:
    // hubspot:   { portalId: '...', formId: '...' },
    // webhook:   { url: 'https://...' },
    // salesforce:{ instanceUrl: '...', token: '...' },
};

const AUTOMATION_CONFIG = {
    immediateCallMinutes: 15,
    secondFollowupHours:  4,
    clinicalReviewHours:  24,
};

// ══════════════════════════════════════════════════════════
// 2. PIPELINE STAGES — Reclutamiento VITALIS
// ══════════════════════════════════════════════════════════
const PIPELINE_STAGES = {
    new:          'Nuevo lead',
    contacted:    'Contactado',
    prequalified: 'Pre-calificado',
    sent_to_site: 'Enviado a sitio',
    screening:    'Screening agendado',
    show:         'Show',
    enrolled:     'Enrolled',
    rejected:     'No califica'
};

// ══════════════════════════════════════════════════════════
// 3. LEAD STATUS ENUM
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
// 4. CONDITION → OWNER MAPPING
// ══════════════════════════════════════════════════════════
const CONDITION_OWNERS = {
    'rodillas':    { name: 'Coord. Rodillas',        id: 'coord_rodilla',       fallback: 'coord_general' },
    'pap-anormal': { name: 'Coord. Salud Femenina',  id: 'coord_salud_femenina',fallback: 'coord_general' },
    'ansiedad':    { name: 'Coord. Salud Mental',    id: 'coord_salud_mental',  fallback: 'coord_general' },
    'lupus':       { name: 'Coord. Autoinmune',      id: 'coord_autoinmune',    fallback: 'coord_general' },
    'diabetes':    { name: 'Coord. Metabólico',      id: 'coord_metabolico',    fallback: 'coord_general' },
    'general':     { name: 'Coordinador General',    id: 'coord_general',       fallback: 'coord_general' },
};

// ══════════════════════════════════════════════════════════
// 5. CONDITION LABELS
// ══════════════════════════════════════════════════════════
const CONDITION_LABELS = {
    'rodillas':    'Dolor de Rodillas',
    'pap-anormal': 'Pap Anormal',
    'ansiedad':    'Ansiedad / Salud Mental',
    'lupus':       'Lupus / Autoinmune',
    'diabetes':    'Diabetes Tipo 2',
    'general':     'General'
};

// ══════════════════════════════════════════════════════════
// 6. EVENT LOGGER
// ══════════════════════════════════════════════════════════

/**
 * logVitalisEvent(eventName, payload)
 * Structured operational event log. In production: POST to analytics endpoint.
 */
function logVitalisEvent(eventName, payload) {
    if (!CRM_CONFIG.debug) return;
    console.log(
        `%c[VITALIS EVENT] ${eventName}`,
        'color:#1a6fc4;font-weight:bold;',
        { event: eventName, ts: new Date().toISOString(), ...payload }
    );
    // Future: POST to /api/events or Supabase analytics table
}

// ══════════════════════════════════════════════════════════
// 7. LEAD DATA NORMALIZER
//    Converts raw form data into the canonical internal format.
//    All CRM adapters and automation functions receive this object.
// ══════════════════════════════════════════════════════════

/**
 * buildLeadData(rawData, condition, scoreResult)
 * @param {Object} rawData     - Form fields (from FormData or manual collection)
 * @param {string} condition   - e.g. 'rodillas' | 'diabetes' | 'ansiedad' ...
 * @param {Object} scoreResult - { label: 'A'|'B'|'C', value: 0-100 }
 * @returns {Object} Canonical LeadData
 */
function buildLeadData(rawData, condition, scoreResult) {
    const referral_code   = localStorage.getItem('vit_referral_code')    || '';
    const referral_source = sessionStorage.getItem('referral_source_code')
                         || localStorage.getItem('vit_ref_source')       || '';

    const ld = {
        personal: {
            name:     (rawData.nombre   || rawData.name  || '').trim(),
            phone:    (rawData.telefono || rawData.phone || '').trim(),
            email:    (rawData.email    || '').trim(),
            city:     (rawData.ciudad   || 'Houston').trim(),
            zip:      (rawData.zip      || '').trim(),
            language: 'es'
        },
        clinical: {
            condition:    condition || rawData.condition || 'general',
            symptoms:     rawData.sintoma      || rawData.nivel_dolor  || rawData.insomnio    || rawData.diagnosticada || '',
            diagnosis:    rawData.diagnostico  || rawData.tiene_dolor  || rawData.ultimo_pap  || '',
            medications:  rawData.tratamiento  || '',
            availability: rawData.disponibilidad || ''
        },
        scoring: {
            label: scoreResult ? scoreResult.label : 'C',
            value: scoreResult ? scoreResult.value : 0
        },
        source: {
            landing:          window.location.pathname,
            campaign:         _getQueryParam('utm_campaign') || '',
            ad:               _getQueryParam('utm_content')  || '',
            channel:          _getQueryParam('utm_medium')   || _getQueryParam('utm_source') || 'organic',
            referral_source,
            referral_code
        },
        metadata: {
            created_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
            page_url:   window.location.href,
            lead_id:    'VPL' + Date.now()
        },
        status:         LEAD_STATUS.NEW,
        pipeline_stage: PIPELINE_STAGES.new
    };

    logVitalisEvent('lead_built', { condition: ld.clinical.condition, score: ld.scoring.label, lead_id: ld.metadata.lead_id });
    return ld;
}

// ══════════════════════════════════════════════════════════
// 8. ASSIGN OWNER BY CONDITION
// ══════════════════════════════════════════════════════════

/**
 * assignLeadOwner(condition)
 * Returns the owner object for a given clinical condition.
 * In production: map owner.id to actual Kommo user_id.
 */
function assignLeadOwner(condition) {
    return CONDITION_OWNERS[condition] || CONDITION_OWNERS['general'];
}

// ══════════════════════════════════════════════════════════
// 9. BUILD AUTOMATION CONTEXT
//    Derives all automation decisions from a canonical leadData.
// ══════════════════════════════════════════════════════════

/**
 * buildAutomationContext(leadData)
 * @returns {Object} automationContext with owner, urgency, tasks, routing
 */
function buildAutomationContext(leadData) {
    const score     = leadData.scoring.label;
    const condition = leadData.clinical.condition;
    const phone     = leadData.personal.phone;
    const email     = leadData.personal.email;
    const refSource = leadData.source.referral_source;

    // Urgency logic
    let urgency_level = 'low';
    if (score === 'A') urgency_level = 'high';
    else if (score === 'B') urgency_level = 'medium';
    // Override: pap-anormal or ansiedad with score A → always max urgency
    if ((condition === 'pap-anormal' || condition === 'ansiedad') && score === 'A') {
        urgency_level = 'high';
    }

    // Preferred contact channel
    const followup_channel = phone ? 'whatsapp' : (email ? 'email' : 'none');

    // Routing notes
    const routing_notes = refSource
        ? `Lead de comunidad — referido por ${refSource}`
        : 'Lead directo';

    // Tasks to create on CRM
    const tasks_to_create = [
        {
            type:         'Llamar lead nuevo',
            dueInMinutes: AUTOMATION_CONFIG.immediateCallMinutes,
            priority:     'high'
        },
        {
            type:         'Seguimiento si no responde',
            dueInMinutes: AUTOMATION_CONFIG.secondFollowupHours * 60,
            priority:     'medium'
        },
        {
            type:         'Verificar elegibilidad clínica',
            dueInMinutes: AUTOMATION_CONFIG.clinicalReviewHours * 60,
            priority:     'medium'
        },
    ];

    const ctx = {
        assigned_owner:  assignLeadOwner(condition),
        urgency_level,
        followup_needed: followup_channel !== 'none',
        followup_channel,
        pipeline_stage:  PIPELINE_STAGES.new,
        tasks_to_create,
        routing_notes,
        condition_label: CONDITION_LABELS[condition] || condition,
    };

    logVitalisEvent('automation_context_created', {
        condition,
        urgency: urgency_level,
        owner:   ctx.assigned_owner.name,
        routing: routing_notes
    });

    return ctx;
}

// ══════════════════════════════════════════════════════════
// 10. CREATE KOMMO TASK
// ══════════════════════════════════════════════════════════

/**
 * createKommoTask(leadId, taskType, dueInMinutes, priority)
 * Creates a task linked to a lead in Kommo.
 * In DEV mode: logs payload only.
 */
function createKommoTask(leadId, taskType, dueInMinutes, priority = 'medium') {
    const cfg = CRM_CONFIG.kommo;
    const dueTimestamp = Math.floor(Date.now() / 1000) + (dueInMinutes * 60);

    const payload = [{
        entity_id:     leadId,
        entity_type:   'leads',
        task_type_id:  1,         // 1 = Call (Kommo default). Adjust per Kommo settings.
        text:          taskType,
        complete_till: dueTimestamp,
        // Kommo doesn't have native priority via API; embed in text prefix for operators
        _priority:     priority   // internal metadata only
    }];

    logVitalisEvent('task_created', { leadId, taskType, dueInMinutes, priority });

    if (!cfg.token || cfg.token === 'REPLACE_IN_PRODUCTION') {
        console.log('[VITALIS TASK] DEV MODE — task payload (not sent):', payload);
        return Promise.resolve({ dev: true, payload });
    }

    return fetch(`https://${cfg.domain}/api/v4/tasks`, {
        method:  'POST',
        headers: {
            'Authorization': `Bearer ${cfg.token}`,
            'Content-Type':  'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .catch(err => {
        console.warn('[VITALIS TASK] Error creating task:', taskType, err);
        return null;
    });
}

// ══════════════════════════════════════════════════════════
// 11. SEND INITIAL FOLLOWUP
//     Prepares and logs the initial patient message.
//     Future: connect to WhatsApp Business API / Twilio / SendGrid.
// ══════════════════════════════════════════════════════════

/**
 * sendInitialFollowup(leadData)
 * Builds the followup message and payload, logs it, and returns it.
 * Does NOT send to patient yet (no API connected in MVP).
 */
function sendInitialFollowup(leadData) {
    const firstName = (leadData.personal.name || 'paciente').split(' ')[0];
    const phone     = leadData.personal.phone;
    const condition = leadData.clinical.condition;
    const condLabel = CONDITION_LABELS[condition] || condition;
    const refSource = leadData.source.referral_source;

    let message = `Hola ${firstName}, ya recibimos tu información en VITALIS.`;
    if (condition && condition !== 'general') {
        message += ` Recibimos tu información sobre ${condLabel}.`;
    }
    message += ' Nuestro equipo revisará tus datos y te contactará pronto para orientarte en español.';

    const followupPayload = {
        channel:   phone ? 'whatsapp' : 'email',
        to:        phone || leadData.personal.email || '',
        message,
        trigger:   'new_lead',
        condition,
        lead_id:   leadData.metadata.lead_id,
        sent_at:   null,  // Future: set when actually delivered
        // Internal note — NOT shown to patient
        _internal: refSource
            ? `Lead de comunidad — referido por ${refSource}. Priorizar contacto.`
            : null,
    };

    logVitalisEvent('initial_followup_prepared', {
        channel:   followupPayload.channel,
        condition,
        lead_id:   leadData.metadata.lead_id
    });

    console.log('[VITALIS FOLLOWUP] Payload listo para envío:', followupPayload);
    // Future integration points:
    // WhatsApp Business API: POST https://graph.facebook.com/v18.0/{phone_id}/messages
    // Twilio:                client.messages.create({ to, from, body })
    // SendGrid:              sgMail.send({ to, from, subject, text })

    return Promise.resolve(followupPayload);
}

// ══════════════════════════════════════════════════════════
// 12. UPDATE LEAD STAGE
//     Future: called from dashboard-investigador or backend.
// ══════════════════════════════════════════════════════════

/**
 * updateLeadStage(leadId, stageName)
 * Moves a lead to a new pipeline stage in Kommo.
 * stageName must be a key of PIPELINE_STAGES.
 *
 * Future usage from dashboard-investigador:
 *   window.VCrm.updateLeadStage(lead.kommo_id, 'contacted');
 */
function updateLeadStage(leadId, stageName) {
    const cfg = CRM_CONFIG.kommo;
    logVitalisEvent('stage_update_requested', { leadId, stageName });

    if (!cfg.token || cfg.token === 'REPLACE_IN_PRODUCTION') {
        console.log('[VITALIS STAGE] DEV MODE — stage update (not sent):', { leadId, stageName });
        return Promise.resolve({ dev: true, leadId, stageName });
    }

    // To activate: map stageName → Kommo status_id in your pipeline config
    // const KOMMO_STAGE_IDS = { new: 12345, contacted: 12346, prequalified: 12347, ... };
    // const status_id = KOMMO_STAGE_IDS[stageName];
    // return fetch(`https://${cfg.domain}/api/v4/leads/${leadId}`, {
    //     method: 'PATCH',
    //     headers: { 'Authorization': `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ status_id })
    // }).then(r => r.json());

    return Promise.resolve({ queued: true, leadId, stageName });
}

// ══════════════════════════════════════════════════════════
// 13. AUTOMATION RUNNER — called after successful CRM send
// ══════════════════════════════════════════════════════════

/**
 * runAutomationAfterCRM(crmResult, leadData)
 * Chains task creation + initial followup after a lead is created in CRM.
 * All sub-tasks are fire-and-forget; errors are swallowed here.
 */
function runAutomationAfterCRM(crmResult, leadData) {
    const ctx = buildAutomationContext(leadData);
    // Use Kommo's returned lead ID if available, else use internal ID
    const kommoId = (crmResult && crmResult.data && crmResult.data._embedded
                      ? crmResult.data._embedded.leads[0].id
                      : null)
                 || leadData.metadata.lead_id;

    // Create all tasks (non-blocking)
    ctx.tasks_to_create.forEach(task => {
        createKommoTask(kommoId, task.type, task.dueInMinutes, task.priority)
            .catch(e => console.warn('[VITALIS] Task silently failed:', e));
    });

    // Fire initial followup (non-blocking)
    sendInitialFollowup(leadData).catch(() => {});

    logVitalisEvent('automation_complete', {
        lead_id:   leadData.metadata.lead_id,
        owner:     ctx.assigned_owner.name,
        urgency:   ctx.urgency_level,
        tasks:     ctx.tasks_to_create.length,
        kommo_id:  kommoId
    });

    return ctx;
}

// ══════════════════════════════════════════════════════════
// 14. FALLBACK AUTOMATION — called if CRM send fails
// ══════════════════════════════════════════════════════════

/**
 * fallbackAutomation(leadData)
 * Ensures data is queued and followup is prepared even if CRM is down.
 */
function fallbackAutomation(leadData) {
    logVitalisEvent('automation_fallback_triggered', {
        lead_id:   leadData.metadata.lead_id,
        condition: leadData.clinical.condition
    });
    queuePendingLead(leadData);
    sendInitialFollowup(leadData).catch(() => {});
    return Promise.resolve({ fallback: true });
}

// ══════════════════════════════════════════════════════════
// 15. MAIN ROUTER — always call this, never a CRM fn directly
//     Returns a Promise that ALWAYS resolves (never rejects).
// ══════════════════════════════════════════════════════════

/**
 * sendLeadToCRM(leadData)
 * Fire-and-forget-safe. Returns Promise<{success?, fallback?, data?}>.
 * Backup to localStorage happens synchronously before any network call.
 */
function sendLeadToCRM(leadData) {
    // Always backup first (synchronous — data is safe before any network)
    _saveLocalBackup(leadData);

    logVitalisEvent('lead_sent_to_crm', {
        condition: leadData.clinical.condition,
        score:     leadData.scoring.label,
        lead_id:   leadData.metadata.lead_id
    });

    const provider = CRM_CONFIG.provider;
    if (provider === 'kommo')    return _sendToKommo(leadData);
    // Future: if (provider === 'hubspot')    return _sendToHubspot(leadData);
    // Future: if (provider === 'webhook')    return _sendToWebhook(leadData);
    // Future: if (provider === 'salesforce') return _sendToSalesforce(leadData);

    return _sendToFallback(leadData, 'No provider configured');
}

// ══════════════════════════════════════════════════════════
// 16. KOMMO ADAPTER
// ══════════════════════════════════════════════════════════

function _transformToKommoFormat(ld) {
    const f   = CRM_CONFIG.kommo.fields;
    const ctx = buildAutomationContext(ld);
    const name  = ld.personal.name  || 'Lead sin nombre';
    const phone = ld.personal.phone || '';

    const payload = [{
        name:      `[VITALIS] ${ctx.condition_label} — ${name}`,
        price:     0,
        status_id: 0,  // Default pipeline stage — configure in Kommo
        custom_fields_values: [
            { field_id: f.condition,       values: [{ value: ld.clinical.condition }] },
            { field_id: f.score_label,     values: [{ value: ld.scoring.label }] },
            { field_id: f.score_value,     values: [{ value: ld.scoring.value }] },
            { field_id: f.referral_source, values: [{ value: ld.source.referral_source }] },
            { field_id: f.referral_code,   values: [{ value: ld.source.referral_code }] },
            { field_id: f.landing_url,     values: [{ value: ld.source.landing }] },
            { field_id: f.campaign,        values: [{ value: ld.source.campaign }] },
            { field_id: f.lead_status,     values: [{ value: ld.status }] },
            { field_id: f.urgency,         values: [{ value: ctx.urgency_level }] },
            { field_id: f.owner_name,      values: [{ value: ctx.assigned_owner.name }] },
        ],
        _embedded: {
            contacts: [{
                name,
                first_name: name.split(' ')[0],
                last_name:  name.split(' ').slice(1).join(' ') || '',
                custom_fields_values: [
                    ...(phone ? [{ field_code: 'PHONE', values: [{ value: phone, enum_code: 'MOBILE' }] }] : []),
                    ...(ld.personal.email ? [{ field_code: 'EMAIL', values: [{ value: ld.personal.email, enum_code: 'WORK' }] }] : []),
                    { field_id: f.zip_code, values: [{ value: ld.personal.zip }] },
                    { field_id: f.language, values: [{ value: ld.personal.language }] },
                ]
            }],
            notes: [{
                note_type: 'common',
                params: { text: _buildKommoNote(ld, ctx) }
            }]
        }
    }];

    console.log('[VITALIS CRM] Kommo payload:', payload);
    return payload;
}

function _sendToKommo(leadData) {
    const cfg = CRM_CONFIG.kommo;

    if (!cfg.token || cfg.token === 'REPLACE_IN_PRODUCTION' ||
        !cfg.domain || cfg.domain === 'REPLACE_WITH_YOUR_KOMMO_DOMAIN') {
        console.warn('[VITALIS CRM] Kommo token/domain not configured. Lead saved locally only.');
        return _sendToFallback(leadData, 'DEV_MODE — token not set');
    }

    const payload = _transformToKommoFormat(leadData);
    const url     = `https://${cfg.domain}/api/v4/leads/complex`;

    return fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${cfg.token}`,
            'Content-Type':  'application/json'
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
        logVitalisEvent('crm_send_success', { lead_id: leadData.metadata.lead_id });
        return { success: true, data, leadData };
    })
    .catch(err => {
        console.error('[VITALIS CRM] ❌ Error enviando a Kommo:', err);
        logVitalisEvent('crm_send_failed', { lead_id: leadData.metadata.lead_id, error: err.message });
        return _sendToFallback(leadData, err.message);
    });
}

// ══════════════════════════════════════════════════════════
// 17. FALLBACK — data already in localStorage, silently noted
// ══════════════════════════════════════════════════════════

function _sendToFallback(leadData, reason) {
    console.warn('[VITALIS CRM] Fallback activado. Razón:', reason);
    return Promise.resolve({ fallback: true, reason, leadData });
}

// ══════════════════════════════════════════════════════════
// 18. LOCAL STORAGE MANAGEMENT
// ══════════════════════════════════════════════════════════

/** savePendingLead — public alias for _saveLocalBackup */
function savePendingLead(leadData) {
    return _saveLocalBackup(leadData);
}

function _saveLocalBackup(leadData) {
    try {
        const pending = JSON.parse(localStorage.getItem('vit_pending_leads') || '[]');
        const exists  = pending.some(l => l.metadata && l.metadata.lead_id === leadData.metadata.lead_id);
        if (!exists) {
            pending.push({ ...leadData, _backup_status: 'pending', _saved_at: new Date().toISOString() });
            localStorage.setItem('vit_pending_leads', JSON.stringify(pending));
        }
    } catch(e) {
        console.warn('[VITALIS] Could not save local backup:', e);
    }
}

/**
 * queuePendingLead — queues a lead for future retry sync
 * Future: retryPendingLeadSync() iterates this queue
 */
function queuePendingLead(leadData) {
    try {
        const queue = JSON.parse(localStorage.getItem('vit_pending_lead_queue') || '[]');
        queue.push({ ...leadData, _queued_at: new Date().toISOString(), _retries: 0 });
        localStorage.setItem('vit_pending_lead_queue', JSON.stringify(queue));
        console.log('[VITALIS QUEUE] Lead encolado para reintento:', leadData.metadata.lead_id);
    } catch(e) {
        console.warn('[VITALIS QUEUE] Could not queue lead:', e);
    }
}

/**
 * retryPendingLeadSync()
 * Future: iterate vit_pending_lead_queue and retry CRM sends.
 * Call from dashboard-investigador or on next page load.
 */
function retryPendingLeadSync() {
    const queue  = JSON.parse(localStorage.getItem('vit_pending_lead_queue') || '[]');
    const unsent = queue.filter(l => l._backup_status !== 'sent');
    if (unsent.length === 0) return;
    console.log(`[VITALIS QUEUE] ${unsent.length} lead(s) pendiente(s) de reintentar.`);
    // TODO: implement retry with exponential backoff + max retries
    // unsent.forEach(lead => sendLeadToCRM(lead).then(r => { if (r.success) _markLocalBackupSent(lead.metadata.lead_id); }));
}

function _markLocalBackupSent(leadId) {
    try {
        const pending = JSON.parse(localStorage.getItem('vit_pending_leads') || '[]');
        const updated = pending.map(l =>
            l.metadata && l.metadata.lead_id === leadId
                ? { ...l, _backup_status: 'sent', _sent_at: new Date().toISOString() }
                : l
        );
        localStorage.setItem('vit_pending_leads', JSON.stringify(updated));
    } catch(e) { /* silent */ }
}

// ══════════════════════════════════════════════════════════
// 19. HELPERS
// ══════════════════════════════════════════════════════════

function _getQueryParam(key) {
    return new URLSearchParams(window.location.search).get(key) || '';
}

function _buildKommoNote(ld, ctx) {
    return [
        `📋 VITALIS PORTAL — FICHA DE LEAD (v2)`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `👤 Nombre:           ${ld.personal.name}`,
        `📱 Teléfono:         ${ld.personal.phone}`,
        `📧 Email:            ${ld.personal.email || 'N/A'}`,
        `📍 ZIP:              ${ld.personal.zip   || 'N/A'}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🏥 Condición:        ${ctx.condition_label}`,
        `🔬 Síntoma:          ${ld.clinical.symptoms     || 'N/A'}`,
        `💊 Diagnóstico:      ${ld.clinical.diagnosis    || 'N/A'}`,
        `💊 Tratamiento:      ${ld.clinical.medications  || 'N/A'}`,
        `⏰ Disponibilidad:   ${ld.clinical.availability || 'N/A'}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `📊 Score:            ${ld.scoring.label} (${ld.scoring.value}/100)`,
        `🚨 Urgencia:         ${ctx.urgency_level.toUpperCase()}`,
        `👥 Owner asignado:   ${ctx.assigned_owner.name}`,
        `📞 Canal followup:   ${ctx.followup_channel}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🌐 Landing:          ${ld.source.landing}`,
        `📣 Canal:            ${ld.source.channel}`,
        `🔗 Campaña:          ${ld.source.campaign || 'N/A'}`,
        `👥 Referido por:     ${ld.source.referral_source || 'Directo'}`,
        `🎫 Código ref:       ${ld.source.referral_code   || 'N/A'}`,
        `📌 Routing:          ${ctx.routing_notes}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🕐 Enviado:          ${ld.metadata.created_at}`,
        `🔑 ID interno:       ${ld.metadata.lead_id}`,
    ].join('\n');
}

// ══════════════════════════════════════════════════════════
// 20. PUBLIC API
// ══════════════════════════════════════════════════════════
window.VCrm = {
    // Core
    sendLeadToCRM,
    buildLeadData,
    // Automation
    buildAutomationContext,
    runAutomationAfterCRM,
    fallbackAutomation,
    createKommoTask,
    assignLeadOwner,
    sendInitialFollowup,
    updateLeadStage,
    // Storage
    savePendingLead,
    queuePendingLead,
    retryPendingLeadSync,
    // Logging
    logVitalisEvent,
    // Constants (exposed for dashboards and external scripts)
    LEAD_STATUS,
    PIPELINE_STAGES,
    CONDITION_OWNERS,
    CONDITION_LABELS,
    CRM_CONFIG,
    AUTOMATION_CONFIG,
};
