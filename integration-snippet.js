/**
 * VITALIS — Integration Snippet
 *
 * Shows how prescreener-submit.js calls the matching engine
 * and persists the result into the referrals table.
 *
 * This is a REFERENCE file — not loaded directly.
 * Copy the relevant parts into prescreener-submit.js.
 */

// ─────────────────────────────────────────────────────────────────────────────
// STEP A — Map formData to the engine's expected state shape
// ─────────────────────────────────────────────────────────────────────────────

function buildEngineState(formData) {
  return {
    sintoma:        formData.answers?.sintoma        || null,
    duracion:       formData.answers?.duracion       || null,
    edad:           parseInt(formData.age, 10)       || 0,
    ubicacion:      formData.answers?.ubicacion      || null,
    dx:             formData.answers?.dx             || null,
    disponibilidad: formData.answers?.disponibilidad || null,
    idioma:         formData.language === 'en' ? 'en' : 'es'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP B — Inside submitPrescreener(), after scorePatient():
// ─────────────────────────────────────────────────────────────────────────────
//
//   const engineState = buildEngineState(formData);
//   const engineResult = VITALIS_ENGINE.buildEngineOutput(engineState);

// ─────────────────────────────────────────────────────────────────────────────
// STEP C — Merge into referralRow before Supabase insert:
// ─────────────────────────────────────────────────────────────────────────────
//
//   referralRow.matched_study_id = engineResult.study_id;
//   referralRow.match_found      = engineResult.match;
//   referralRow.engine_action    = engineResult.action;
//   referralRow.engine_reason    = engineResult.reason;
//   referralRow.engine_message   = engineResult.message;
//   referralRow.engine_version   = engineResult.engine_version;
//   referralRow.engine_output    = engineResult;   // full object as JSONB

// ─────────────────────────────────────────────────────────────────────────────
// FULL EXAMPLE (copy-paste ready replacement for submitPrescreener)
// ─────────────────────────────────────────────────────────────────────────────

async function submitPrescreenerWithEngine(formData, options) {
  var opts = options || {};

  // 1. Existing scoring (unchanged)
  var scored = VITALIS_PRESCREENER.scorePatient(
    formData.condition,
    formData.answers
  );

  // 2. Run matching engine
  var engineState = buildEngineState(formData);
  var engineResult = VITALIS_ENGINE.buildEngineOutput(engineState);
  console.debug('[VITALIS] Engine →', engineResult);

  // 3. Existing site routing (unchanged)
  var routing = VITALIS_PRESCREENER.selectBestSite(
    { language: formData.language, zipCode: formData.zipCode },
    { id: opts.studyId || engineResult.study_id || null },
    opts.sites || [],
    { distanceBySite: opts.distanceBySite || {} }
  );

  // 4. Build rows
  var now = new Date().toISOString();
  var patientId = 'pat_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  var referralId = 'ref_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);

  var patientRow = {
    id:         patientId,
    first_name: String(formData.firstName || '').trim(),
    last_name:  String(formData.lastName || '').trim(),
    age:        parseInt(formData.age, 10) || null,
    gender:     formData.gender || null,
    ethnicity:  formData.ethnicity || null,
    language:   formData.language || null,
    zip_code:   String(formData.zipCode || '').trim(),
    phone:      String(formData.phone || '').trim(),
    email:      String(formData.email || '').trim(),
    source:     formData.source || ('prescreener:' + formData.condition)
  };

  var referralRow = {
    id:                    referralId,
    patient_id:            patientId,
    study_id:              opts.studyId || engineResult.study_id || null,
    site_id:               routing.siteId,
    referred_at:           now,
    distance_miles:        routing.distanceMiles,
    routing_score:         routing.routingScore,
    status:                'new_referral',
    qualification_score:   scored.score,
    qualification_level:   scored.level,
    flags:                 scored.flags,
    prescreener_data:      scored.prescreenerData,
    estimated_value:       VITALIS_PRESCREENER.pricingFromScore(scored.score),
    billing_status:        'pending',
    last_updated:          now,
    // ── Engine columns ──────────────────────────────────────────────
    matched_study_id:      engineResult.study_id,
    match_found:           engineResult.match,
    engine_action:         engineResult.action,
    engine_reason:         engineResult.reason,
    engine_message:        engineResult.message,
    engine_version:        engineResult.engine_version,
    engine_output:         engineResult   // full object stored as JSONB
  };

  // 5. Supabase insert
  var client = (window.VITALIS_SUPABASE && typeof window.VITALIS_SUPABASE.getSupabaseClient === 'function')
    ? window.VITALIS_SUPABASE.getSupabaseClient()
    : null;

  if (!client) {
    console.warn('[VITALIS] Supabase not available — using fallback');
    console.log('[VITALIS] fallback data:', { patientRow, referralRow });
    return { ok: true, patientId: patientId, referralId: referralId, engineResult: engineResult, fallback: true };
  }

  var p = await client.from('patients').insert(patientRow);
  if (p.error) throw p.error;

  var r = await client.from('referrals').insert(referralRow);
  if (r.error) throw r.error;

  return { ok: true, patientId: patientId, referralId: referralId, engineResult: engineResult, fallback: false };
}
