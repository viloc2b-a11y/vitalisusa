(function initPrescreenerSubmit(global) {
  "use strict";

  // ─── Utilities ───────────────────────────────────────────────────────────

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function generateId(prefix) {
    const rand =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
        : Math.random().toString(36).slice(2, 14);
    return prefix + "_" + rand;
  }

  // ─── Scoring ─────────────────────────────────────────────────────────────
  //
  // scorePatient(condition, answers)
  //
  // Returns:
  //   { score: Number(0–10), level: "high"|"medium"|"low",
  //     flags: String[], prescreenerData: Object }
  //
  // `answers` is a flat key-value object collected from the form.
  // Each condition branch documents its expected keys.

  function scorePatient(condition, answers) {
    const a = answers || {};
    let score = 4; // neutral baseline
    const flags = [];
    const age = parseInt(a.age, 10) || 0;

    // ── Knee Osteoarthritis ──────────────────────────────────────────────
    if (condition === "knee-osteoarthritis" || condition === "osteoartritis-rodilla") {
      // age: ideal 40–85 (+1.5)
      if (age >= 40 && age <= 85) score += 1;
      if (age >= 50 && age <= 75) score += 0.5;

      // severity 1–10 → 0.2 – 2.0 pts  (name="severity")
      const severity = clamp(parseInt(a.severity, 10) || 5, 1, 10);
      score += (severity / 10) * 2;

      // duration (name="duration"):  "<6mo"|"6mo-2y"|"2-5y"|">5y"
      if (a.duration === "2-5y" || a.duration === ">5y") score += 1.5;
      else if (a.duration === "6mo-2y") score += 1;

      // prior treatments (name="priorTreatments", multi-check) → max 1.5 pts
      const treatments = Array.isArray(a.priorTreatments)
        ? a.priorTreatments
        : a.priorTreatments
          ? [a.priorTreatments]
          : [];
      score += clamp(treatments.length * 0.5, 0, 1.5);

      // daily mobility affected (name="mobilityImpacted"): "yes"|"no"
      if (a.mobilityImpacted === "yes") score += 0.5;

      // exclusion: recent surgery (name="recentSurgery"): "yes"|"no"
      if (a.recentSurgery === "yes") {
        score -= 3;
        flags.push("recent_surgery");
      }

      return buildResult(score, flags, {
        condition,
        diagnosisConfirmed: severity >= 6,
        severityLabel: severity + "/10",
        durationLabel: a.duration || "unknown",
        priorTreatmentsFailed: treatments.length > 0,
        bmi: parseFloat(a.bmiRange) || null,
        exclusionFlags: flags,
        answers: a
      });
    }

    // ── Vaginal Yeast Infection ──────────────────────────────────────────
    if (condition === "vaginal-yeast-infection" || condition === "candidiasis-vaginal") {
      // age 18–55
      if (age >= 18 && age <= 55) score += 1;

      // frequency (name="frequency"): "first"|"2-3/year"|"4+/year"
      if (a.frequency === "4+/year") score += 2;
      else if (a.frequency === "2-3/year") score += 1.5;
      else if (a.frequency === "first") score += 0.5;

      // active episode (name="currentEpisode"): "yes"|"no"
      if (a.currentEpisode === "yes") score += 1;

      // prior OTC treatment (name="priorTreatment"): "yes"|"no"
      if (a.priorTreatment === "yes") score += 1;

      // exclusion: pregnant (name="pregnant"): "yes"|"no"
      if (a.pregnant === "yes") {
        score -= 2;
        flags.push("pregnancy_flag");
      }

      return buildResult(score, flags, {
        condition,
        diagnosisConfirmed: a.frequency === "4+/year" || a.frequency === "2-3/year",
        severityLabel: a.frequency || "unknown",
        durationLabel: a.currentEpisode === "yes" ? "Active episode" : "No active episode",
        priorTreatmentsFailed: a.priorTreatment === "yes",
        bmi: null,
        exclusionFlags: flags,
        answers: a
      });
    }

    // ── STD Testing ─────────────────────────────────────────────────────
    if (condition === "std-testing" || condition === "enfermedades-transmision-sexual") {
      // age 18–65
      if (age >= 18 && age <= 65) score += 1;

      // symptoms present (name="hasSymptoms"): "yes"|"no"
      if (a.hasSymptoms === "yes") score += 2;

      // sexually active (name="sexuallyActive"): "yes"|"no"
      if (a.sexuallyActive === "yes") score += 1;

      // last tested (name="lastTested"): "never"|">1y"|"6-12mo"|"<6mo"
      if (a.lastTested === "never" || a.lastTested === ">1y") score += 1.5;
      else if (a.lastTested === "6-12mo") score += 1;

      return buildResult(score, flags, {
        condition,
        diagnosisConfirmed: a.hasSymptoms === "yes",
        severityLabel: a.hasSymptoms === "yes" ? "With symptoms" : "No symptoms",
        durationLabel: "Last tested: " + (a.lastTested || "unknown"),
        priorTreatmentsFailed: false,
        bmi: null,
        exclusionFlags: flags,
        answers: a
      });
    }

    // ── Pap Smear ────────────────────────────────────────────────────────
    if (condition === "pap-smear" || condition === "papanicolaou") {
      // age 21–65
      if (age >= 21 && age <= 65) score += 1;

      // last pap (name="lastPap"): "never"|">3y"|"1-3y"|"<1y"
      if (a.lastPap === "never" || a.lastPap === ">3y") score += 2;
      else if (a.lastPap === "1-3y") score += 1;

      // prior abnormal result (name="abnormalHistory"): "yes"|"no"
      if (a.abnormalHistory === "yes") {
        score += 2;
        flags.push("abnormal_history");
      }

      return buildResult(score, flags, {
        condition,
        diagnosisConfirmed: a.abnormalHistory === "yes",
        severityLabel: a.abnormalHistory === "yes" ? "Abnormal history" : "No abnormal history",
        durationLabel: "Last pap: " + (a.lastPap || "unknown"),
        priorTreatmentsFailed: false,
        bmi: null,
        exclusionFlags: flags,
        answers: a
      });
    }

    // Unknown condition: neutral result
    return buildResult(score, flags, { condition, answers: a });
  }

  // ─── Pricing ─────────────────────────────────────────────────────────────
  //
  // Returns the estimated referral value in USD based on qualification score.
  //   score >= 8  → $120  (high priority)
  //   score 5–7   → $70   (medium priority)
  //   score < 5   → $30   (low priority)

  function pricingFromScore(score) {
    if (score >= 8) return 120;
    if (score >= 5) return 70;
    return 30;
  }

  function buildContactMessagePayload(formData, score) {
    if (score < 7) return null;
    const firstName = String(formData.firstName || "").trim();
    return {
      channels: ["sms", "whatsapp"],
      phone: String(formData.phone || "").trim(),
      message: `Hola ${firstName || "paciente"}, te contactamos de VITALIS para ayudarte a agendar tu siguiente paso.`,
      referralPriority: score >= 8 ? "high" : "medium"
    };
  }

  function buildResult(rawScore, flags, prescreenerData) {
    const score = clamp(Math.round(rawScore * 10) / 10, 0, 10);
    const level = score >= 8 ? "high" : score >= 6 ? "medium" : "low";
    return {
      score,
      level,
      flags,
      prescreenerData: Object.assign({ scoredAt: nowISO() }, prescreenerData, {
        exclusionFlags: flags
      })
    };
  }

  // ─── Site Assignment ─────────────────────────────────────────────────────
  //
  // selectBestSite(patient, study, sites, options)
  //
  // Priority:
  // 1) Language match
  // 2) Higher performance_score
  // 3) Shorter distance (when distance is available)
  //
  // Returns:
  //  { siteId, site, routingScore, distanceMiles }

  function toNumber(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeLanguage(language) {
    return String(language || "").toLowerCase().startsWith("es") ? "es" : "en";
  }

  function getDistanceForSite(site, options) {
    var distanceBySite = (options && options.distanceBySite) || {};
    var directMapDistance = toNumber(distanceBySite[site.id], null);
    if (directMapDistance !== null) return Math.max(0, directMapDistance);

    var siteDistance = toNumber(site.distanceMiles, null);
    if (siteDistance !== null) return Math.max(0, siteDistance);

    var aliasDistance = toNumber(site.distance_from_patient, null);
    if (aliasDistance !== null) return Math.max(0, aliasDistance);

    // Unknown distance gets neutral weight.
    return 15;
  }

  function selectBestSite(patient, study, sites, options) {
    var activeSites = (sites || []).filter(function (s) { return s.active !== false; });
    if (!activeSites.length) return { siteId: null, site: null, routingScore: 0, distanceMiles: null };

    var patientLang = normalizeLanguage(patient && patient.language);

    var ranked = activeSites
      .map(function (site) {
        var siteLanguages = Array.isArray(site.languages) ? site.languages : [];
        var languageMatch = siteLanguages.indexOf(patientLang) >= 0 ? 1 : 0;
        var performanceScore = toNumber(site.performance_score, 50); // 0..100
        var distanceMiles = getDistanceForSite(site, options);
        var distanceScore = clamp(100 - distanceMiles * 4, 0, 100); // lower distance is better

        // Weighted routing score (simple, readable)
        var routingScore = (languageMatch * 40) + (performanceScore * 0.4) + (distanceScore * 0.2);
        return {
          site: site,
          languageMatch: languageMatch,
          performanceScore: performanceScore,
          distanceMiles: distanceMiles,
          routingScore: Math.round(routingScore * 10) / 10
        };
      })
      .sort(function (a, b) { return b.routingScore - a.routingScore; });

    var best = ranked[0];
    return {
      siteId: best.site.id,
      site: best.site,
      routingScore: best.routingScore,
      distanceMiles: best.distanceMiles
    };
  }

  // ─── Submit ──────────────────────────────────────────────────────────────
  //
  // submitPrescreener(formData, options) → Promise<Result>
  //
  // formData: { firstName, lastName, phone, email, zipCode, age,
  //             gender?, language, condition, source?, answers: {...} }
  // options:  { studyId: String|null, sites: Site[] }
  //
  // Result: { ok: true, patientId, referralId, score, level, fallback: bool }
  // Throws on Supabase write error.

  async function submitPrescreener(formData, options) {
    const opts = options || {};
    const { score, level, flags, prescreenerData } = scorePatient(
      formData.condition,
      formData.answers
    );
    const contactPayload = buildContactMessagePayload(formData, score);

    const routing = selectBestSite(
      { language: formData.language, zipCode: formData.zipCode },
      { id: opts.studyId || null },
      opts.sites || [],
      { distanceBySite: opts.distanceBySite || {} }
    );
    const now = nowISO();
    const patientId = generateId("pat");
    const referralId = generateId("ref");

    const patientRow = {
      id: patientId,
      first_name: String(formData.firstName || "").trim(),
      last_name: String(formData.lastName || "").trim(),
      age: parseInt(formData.age, 10) || null,
      gender: formData.gender || null,
      ethnicity: formData.ethnicity || null,
      language: formData.language || null,
      zip_code: String(formData.zipCode || "").trim(),
      phone: String(formData.phone || "").trim(),
      email: String(formData.email || "").trim(),
      source: formData.source || ("prescreener:" + formData.condition)
    };

    const referralRow = {
      id: referralId,
      patient_id: patientId,
      study_id: opts.studyId || null,
      site_id: routing.siteId,
      referred_at: now,
      distance_miles: routing.distanceMiles,
      routing_score: routing.routingScore,
      status: "new_referral",
      qualification_score: score,
      qualification_level: level,
      flags: flags,
      diagnosis_confirmed: Boolean(prescreenerData.diagnosisConfirmed),
      severity_label: prescreenerData.severityLabel || null,
      duration_label: prescreenerData.durationLabel || null,
      prior_treatments_failed: Boolean(prescreenerData.priorTreatmentsFailed),
      bmi: prescreenerData.bmi || null,
      exclusion_flags: prescreenerData.exclusionFlags || [],
      notes: [],
      prescreener_data: prescreenerData,
      estimated_value: pricingFromScore(score),
      billing_status: "pending",
      last_updated: now
    };

    const client =
      global.VITALIS_SUPABASE && typeof global.VITALIS_SUPABASE.getSupabaseClient === "function"
        ? global.VITALIS_SUPABASE.getSupabaseClient()
        : null;

    if (!client) {
      console.log("[VITALIS] prescreener fallback — no Supabase client", { patientRow, referralRow });
      if (contactPayload) console.log("[VITALIS] auto_contact_payload", contactPayload);
      return { ok: true, patientId, referralId, score, level, contactPayload, fallback: true };
    }

    const { error: patientErr } = await client.from("patients").insert(patientRow);
    if (patientErr) throw patientErr;

    const { error: referralErr } = await client.from("referrals").insert(referralRow);
    if (referralErr) throw referralErr;

    if (contactPayload) console.log("[VITALIS] auto_contact_payload", contactPayload);
    return { ok: true, patientId, referralId, score, level, contactPayload, fallback: false };
  }

  global.VITALIS_PRESCREENER = { selectBestSite, scorePatient, submitPrescreener, pricingFromScore, buildContactMessagePayload };
})(window);
