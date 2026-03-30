/**
 * VITALIS — Matching & Routing Engine v1
 *
 * Pure logic. No Supabase. No UI.
 * Takes pre-screener state → returns structured routing decision.
 *
 * API:
 *   VITALIS_ENGINE.matchStudies(state, studies)
 *   VITALIS_ENGINE.scoreLead(state)
 *   VITALIS_ENGINE.routeLead(state, matchedStudies, scoreResult)
 *   VITALIS_ENGINE.getResultMessage(priority, idioma, matched)
 *   VITALIS_ENGINE.getQueuePriority(priority, action)
 *   VITALIS_ENGINE.buildEngineOutput(state, studies?)
 */
(function (global) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1 — STUDY REGISTRY
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // Each study: id, condition, include rules, exclude rules, priority, active.
  // Lower priority number = higher importance.
  // Add new studies here as protocols are onboarded.

  var DEFAULT_STUDIES = [
    {
      id: 'OA_KNEE_01',
      condition: 'artritis',
      include: {
        edad_min: 45,
        edad_max: 85,
        ubicacion: ['cerca', 'lejos'],
        dx: ['artritis', 'revisado']
      },
      exclude: {
        ubicacion: ['fuera']
      },
      priority: 1,
      active: true
    },
    {
      id: 'OA_KNEE_02',
      condition: 'artritis',
      include: {
        edad_min: 40,
        edad_max: 75,
        ubicacion: ['cerca'],
        dx: ['artritis']
      },
      exclude: {},
      priority: 2,
      active: true
    },
    {
      id: 'MOBILITY_GEN_01',
      condition: 'movilidad',
      include: {
        edad_min: 50,
        edad_max: 80,
        ubicacion: ['cerca', 'lejos'],
        sintoma: ['caminar', 'escaleras', 'varios']
      },
      exclude: {
        ubicacion: ['fuera']
      },
      priority: 3,
      active: true
    }
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2 — MATCHING FUNCTION
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // matchStudies(state, studies) → Study[]
  //
  // Rules:
  //   - Must pass ALL inclusion criteria
  //   - Must NOT violate any exclusion criteria
  //   - Ignore studies where active = false

  function matchStudies(state, studies) {
    var list = studies || DEFAULT_STUDIES;
    var edad = Number(state.edad) || 0;

    return list.filter(function (study) {
      if (!study.active) return false;

      var inc = study.include || {};
      var exc = study.exclude || {};

      // ── Inclusion checks ──────────────────────────────────────────
      if (typeof inc.edad_min === 'number' && edad < inc.edad_min) return false;
      if (typeof inc.edad_max === 'number' && edad > inc.edad_max) return false;
      if (Array.isArray(inc.ubicacion) && inc.ubicacion.indexOf(state.ubicacion) === -1) return false;
      if (Array.isArray(inc.dx) && inc.dx.indexOf(state.dx) === -1) return false;
      if (Array.isArray(inc.sintoma) && inc.sintoma.indexOf(state.sintoma) === -1) return false;
      if (Array.isArray(inc.duracion) && inc.duracion.indexOf(state.duracion) === -1) return false;

      // ── Exclusion checks ──────────────────────────────────────────
      if (Array.isArray(exc.ubicacion) && exc.ubicacion.indexOf(state.ubicacion) !== -1) return false;
      if (Array.isArray(exc.dx) && exc.dx.indexOf(state.dx) !== -1) return false;
      if (Array.isArray(exc.sintoma) && exc.sintoma.indexOf(state.sintoma) !== -1) return false;

      return true;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3 — LEAD SCORING
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // scoreLead(state) → { score: Number, priority: 'high'|'medium'|'waitlist' }
  //
  // Scoring table (max 15):
  //   disponibilidad flexible/manana/tarde/fin_semana  → +3
  //   disponibilidad nomas_saber                       → +1
  //   sintoma varios                                   → +3
  //   sintoma caminar/escaleras/hinchon                → +2
  //   sintoma rigidez                                  → +1
  //   ubicacion cerca                                  → +3
  //   ubicacion lejos                                  → +1
  //   ubicacion fuera                                  → direct waitlist
  //   duracion 1a3a                                    → +2
  //   duracion mas3a                                   → +3
  //   dx artritis                                      → +3
  //   dx revisado                                      → +1

  function scoreLead(state) {
    // Hard fail: fuera → always waitlist
    if (state.ubicacion === 'fuera') {
      return { score: 0, priority: 'waitlist' };
    }

    var score = 0;

    // Disponibilidad
    if (state.disponibilidad === 'flexible' ||
        state.disponibilidad === 'manana' ||
        state.disponibilidad === 'tarde' ||
        state.disponibilidad === 'fin_semana') {
      score += 3;
    } else if (state.disponibilidad === 'nomas_saber') {
      score += 1;
    }

    // Sintoma
    if (state.sintoma === 'varios') {
      score += 3;
    } else if (state.sintoma === 'caminar' ||
               state.sintoma === 'escaleras' ||
               state.sintoma === 'hinchon') {
      score += 2;
    } else if (state.sintoma === 'rigidez') {
      score += 1;
    }

    // Ubicacion
    if (state.ubicacion === 'cerca') {
      score += 3;
    } else if (state.ubicacion === 'lejos') {
      score += 1;
    }

    // Duracion
    if (state.duracion === 'mas3a') {
      score += 3;
    } else if (state.duracion === '1a3a') {
      score += 2;
    }

    // Diagnostico
    if (state.dx === 'artritis') {
      score += 3;
    } else if (state.dx === 'revisado') {
      score += 1;
    }

    // Priority thresholds
    var priority;
    if (score >= 10) {
      priority = 'high';
    } else if (score >= 6) {
      priority = 'medium';
    } else {
      priority = 'waitlist';
    }

    return { score: score, priority: priority };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4 — ROUTING ENGINE
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // routeLead(state, matchedStudies, scoreResult) → routing object
  //
  // Rules:
  //   No matches       → waitlist + store and nurture
  //   Matched + high   → call within 2 hours
  //   Matched + medium → call within 24 hours
  //   Matched + low    → store and nurture (waitlist)

  function routeLead(state, matchedStudies, scoreResult) {
    var score = scoreResult.score;
    var priority = scoreResult.priority;

    // No matches → waitlist
    if (!matchedStudies || matchedStudies.length === 0) {
      return {
        study_id: null,
        priority: 'waitlist',
        score: score,
        action: 'store and nurture',
        reason: 'No matching active studies for this patient profile'
      };
    }

    // Sort by study priority (ascending = lowest number = highest importance)
    var sorted = matchedStudies.slice().sort(function (a, b) {
      return a.priority - b.priority;
    });
    var bestStudy = sorted[0];

    // If score too low → waitlist even if matched
    if (priority === 'waitlist') {
      return {
        study_id: bestStudy.id,
        priority: 'waitlist',
        score: score,
        action: 'store and nurture',
        reason: 'Matched ' + bestStudy.id + ' but lead score too low (' + score + ')'
      };
    }

    // Assign coordinator action
    var action;
    if (priority === 'high') {
      action = 'call within 2 hours';
    } else {
      action = 'call within 24 hours';
    }

    return {
      study_id: bestStudy.id,
      priority: priority,
      score: score,
      action: action,
      reason: 'Matched ' + bestStudy.id + ', ' + priority + ' priority lead (score: ' + score + ')'
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5 — QUEUE PRIORITY
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // getQueuePriority(priority, action) → { queue_rank, queue_label }
  //
  // Queue rules:
  //   high   + call within 2 hours   → rank 1 / urgent
  //   medium + call within 24 hours  → rank 3 / standard
  //   waitlist                        → rank 9 / nurture

  function getQueuePriority(priority, action) {
    if (priority === 'high' && action === 'call within 2 hours') {
      return { queue_rank: 1, queue_label: 'urgent' };
    }
    if (priority === 'medium' && action === 'call within 24 hours') {
      return { queue_rank: 3, queue_label: 'standard' };
    }
    return { queue_rank: 9, queue_label: 'nurture' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 6 — USER-FACING MESSAGES (Spanish-first)
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // getResultMessage(priority, idioma, matched) → string

  var MESSAGES = {
    es: {
      matched_high:     'Hay un programa en Houston que puede aplicar para tu caso. Un coordinador te llamará en las próximas 2 a 4 horas.',
      matched_medium:   'Hay posibilidades para un programa en Houston. Un coordinador te contactará hoy.',
      waitlist:         'Por ahora no tenemos un programa exacto para ti, pero te avisaremos cuando haya uno disponible en tu área.'
    },
    en: {
      matched_high:     'There is a program in Houston that may apply to your case. A coordinator will call you within the next 2 to 4 hours.',
      matched_medium:   'There are possibilities for a program in Houston. A coordinator will contact you today.',
      waitlist:         'We don\'t have an exact match for you right now, but we\'ll notify you when one becomes available in your area.'
    }
  };

  function getResultMessage(priority, idioma, matched) {
    var lang = (idioma === 'en') ? 'en' : 'es';
    var msgs = MESSAGES[lang] || MESSAGES.es;

    if (matched && priority === 'high') return msgs.matched_high;
    if (matched && priority === 'medium') return msgs.matched_medium;
    return msgs.waitlist;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 7 — ORCHESTRATOR
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // buildEngineOutput(state, studies?) → final structured object
  //
  // This is the single entry point. Call this from prescreener-submit.js.

  function buildEngineOutput(state, studies) {
    // Defensive fallback
    state = state || {};
    var idioma = state.idioma || 'es';

    var matched = matchStudies(state, studies);
    var scoreResult = scoreLead(state);
    var routing = routeLead(state, matched, scoreResult);

    // match = true ONLY when study assigned AND priority is not waitlist
    var isMatch = routing.study_id !== null && routing.priority !== 'waitlist';

    var message = getResultMessage(routing.priority, idioma, isMatch);
    var queue = getQueuePriority(routing.priority, routing.action);

    return {
      study_id:       routing.study_id,
      match:          isMatch,
      priority:       routing.priority,
      score:          routing.score,
      action:         routing.action,
      reason:         routing.reason,
      message:        message,
      queue_rank:     queue.queue_rank,
      queue_label:    queue.queue_label,
      matched_count:  matched.length,
      engine_version: 'v1'
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  global.VITALIS_ENGINE = {
    matchStudies:      matchStudies,
    scoreLead:         scoreLead,
    routeLead:         routeLead,
    getResultMessage:  getResultMessage,
    getQueuePriority:  getQueuePriority,
    buildEngineOutput: buildEngineOutput,
    DEFAULT_STUDIES:   DEFAULT_STUDIES
  };

})(typeof window !== 'undefined' ? window : globalThis);
