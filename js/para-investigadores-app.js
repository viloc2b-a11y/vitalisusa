(function investigadoresApp() {
  // ===== 1) Constants and fallback data =====
  const REFERRAL_STATUS = Object.freeze({
    NEW_REFERRAL: "new_referral",
    CONTACTED: "contacted",
    SCHEDULED: "scheduled",
    SCREENED: "screened",
    RANDOMIZED: "randomized",
    INELIGIBLE: "ineligible",
    UNREACHABLE: "unreachable",
    NO_SHOW: "no_show"
  });

  const DASHBOARD_LOCALE = /^en\b/i.test(String(document.documentElement.getAttribute("lang") || "").trim()) ? "en" : "es";

  const STRINGS = Object.freeze({
    es: {
      statusLabels: {
        [REFERRAL_STATUS.NEW_REFERRAL]: "Nuevo",
        [REFERRAL_STATUS.CONTACTED]: "Contactado",
        [REFERRAL_STATUS.SCHEDULED]: "Programado",
        [REFERRAL_STATUS.SCREENED]: "Screening completado",
        [REFERRAL_STATUS.RANDOMIZED]: "Randomizado",
        [REFERRAL_STATUS.INELIGIBLE]: "No elegible",
        [REFERRAL_STATUS.UNREACHABLE]: "No localizable",
        [REFERRAL_STATUS.NO_SHOW]: "No asistió"
      },
      transitionError: "Transición no permitida para el estado actual.",
      updateStatusError: "No se pudo actualizar el estado. Intenta de nuevo.",
      loadingReferrals: "Cargando referrals...",
      fallbackLocal: "Vista en modo local (fallback). Configura Supabase para datos en vivo.",
      supabaseLoadError: "No se pudieron cargar datos de Supabase. Mostrando fallback local.",
      bulkSelectError: "Selecciona al menos un referral para acción masiva.",
      bulkUpdated: (n) => `${n} referral(s) actualizados.`,
      tableEmpty: "No hay referrals con estos filtros.",
      qualHigh: "Alta",
      qualMed: "Media",
      qualLow: "Baja",
      viewDetail: "Ver detalle",
      selectAllAria: "Seleccionar todos",
      selectReferralAria: (id) => `Seleccionar referral ${id}`,
      ageSuffix: "años",
      mileSingular: "milla",
      milePlural: "millas",
      unassignedSite: "Sin sitio asignado",
      modalPending: "Pendiente",
      modalNoPreference: "Sin preferencia",
      modalMilesWord: "millas",
      presDiagnosis: (v) => `Diagnóstico confirmado: ${v ? "Sí" : "No"}`,
      presSeverity: (v) => `Severidad: ${v}`,
      presDuration: (v) => `Duración: ${v}`,
      presPriorTx: (v) => `Tratamientos previos fallidos: ${v ? "Sí" : "No"}`,
      presBmi: (v) => `BMI: ${v}`,
      presExclusion: (v) => (v ? `Flags de exclusión: ${v}` : "Sin criterios mayores de exclusión."),
      autoContactLine: (phone) => `Auto-contacto listo (SMS/WhatsApp): ${phone || "Sin teléfono"}`,
      routingLine: (score) => `Routing score: ${score}`,
      slaContactFlag: "SLA: Contacto pendiente >24h",
      slaScheduleFlag: "SLA: Agendamiento pendiente >72h",
      noNotes: "Sin notas adicionales.",
      waTemplate: (name) => `Hola ${name}, te contactamos de VITALIS para coordinar tu screening.`,
      autoContactMsg: (name) =>
        `Hola ${name}, te contactamos de VITALIS. Tu perfil fue priorizado y podemos ayudarte a agendar screening.`,
      slaContactChip: "Contacto >24h",
      slaScheduleChip: "Agendamiento >72h",
      slaOnTrack: "En tiempo",
      b2bRequired: "Completa todos los campos requeridos.",
      b2bMonthly: "El objetivo mensual debe ser mayor a 0.",
      b2bSuccess: "Solicitud enviada. Nuestro equipo te contactará pronto.",
      b2bError: "No se pudo enviar la solicitud. Intenta nuevamente.",
      billingLabels: { pending: "Pendiente", billed: "Facturado", paid: "Pagado" },
      notAvailable: "N/D"
    },
    en: {
      statusLabels: {
        [REFERRAL_STATUS.NEW_REFERRAL]: "New",
        [REFERRAL_STATUS.CONTACTED]: "Contacted",
        [REFERRAL_STATUS.SCHEDULED]: "Scheduled",
        [REFERRAL_STATUS.SCREENED]: "Screened",
        [REFERRAL_STATUS.RANDOMIZED]: "Randomized",
        [REFERRAL_STATUS.INELIGIBLE]: "Ineligible",
        [REFERRAL_STATUS.UNREACHABLE]: "Unreachable",
        [REFERRAL_STATUS.NO_SHOW]: "No-show"
      },
      transitionError: "This status change is not allowed from the current state.",
      updateStatusError: "Could not update status. Please try again.",
      loadingReferrals: "Loading referrals...",
      fallbackLocal: "Local preview (fallback). Configure Supabase for live data.",
      supabaseLoadError: "Could not load Supabase data. Showing local fallback.",
      bulkSelectError: "Select at least one referral for bulk action.",
      bulkUpdated: (n) => `${n} referral(s) updated.`,
      tableEmpty: "No referrals match these filters.",
      qualHigh: "High",
      qualMed: "Medium",
      qualLow: "Low",
      viewDetail: "View detail",
      selectAllAria: "Select all",
      selectReferralAria: (id) => `Select referral ${id}`,
      ageSuffix: "years",
      mileSingular: "mile",
      milePlural: "miles",
      unassignedSite: "Unassigned site",
      modalPending: "Pending",
      modalNoPreference: "No preference",
      modalMilesWord: "miles",
      presDiagnosis: (v) => `Diagnosis confirmed: ${v ? "Yes" : "No"}`,
      presSeverity: (v) => `Severity: ${v}`,
      presDuration: (v) => `Duration: ${v}`,
      presPriorTx: (v) => `Prior treatments failed: ${v ? "Yes" : "No"}`,
      presBmi: (v) => `BMI: ${v}`,
      presExclusion: (v) => (v ? `Exclusion flags: ${v}` : "No major exclusion criteria flagged."),
      autoContactLine: (phone) => `Auto-contact ready (SMS/WhatsApp): ${phone || "No phone on file"}`,
      routingLine: (score) => `Routing score: ${score}`,
      slaContactFlag: "SLA: Contact overdue >24h",
      slaScheduleFlag: "SLA: Scheduling overdue >72h",
      noNotes: "No additional notes.",
      waTemplate: (name) => `Hi ${name}, we're reaching out from VITALIS to coordinate your screening.`,
      autoContactMsg: (name) =>
        `Hi ${name}, we're reaching out from VITALIS. Your profile was prioritized and we can help schedule screening.`,
      slaContactChip: "Contact >24h",
      slaScheduleChip: "Scheduling >72h",
      slaOnTrack: "On track",
      b2bRequired: "Please complete all required fields.",
      b2bMonthly: "Monthly goal must be greater than 0.",
      b2bSuccess: "Request sent. Our team will contact you soon.",
      b2bError: "Could not send the request. Please try again.",
      billingLabels: { pending: "Pending", billed: "Billed", paid: "Paid" },
      notAvailable: "N/A"
    }
  });

  const t = STRINGS[DASHBOARD_LOCALE];

  function billingDisplay(status) {
    const key = String(status || "pending").toLowerCase();
    return (t.billingLabels && t.billingLabels[key]) || status || key;
  }

  function statusDisplay(status) {
    return t.statusLabels[status] || status;
  }

  const STATUS_BADGE_CLASSES = Object.freeze({
    [REFERRAL_STATUS.NEW_REFERRAL]: "status-new",
    [REFERRAL_STATUS.CONTACTED]: "status-contact",
    [REFERRAL_STATUS.SCHEDULED]: "status-active",
    [REFERRAL_STATUS.SCREENED]: "status-screened",
    [REFERRAL_STATUS.RANDOMIZED]: "status-randomized",
    [REFERRAL_STATUS.INELIGIBLE]: "status-ineligible",
    [REFERRAL_STATUS.UNREACHABLE]: "status-unreachable",
    [REFERRAL_STATUS.NO_SHOW]: "status-no-show"
  });

  const ALLOWED_TRANSITIONS = Object.freeze({
    [REFERRAL_STATUS.NEW_REFERRAL]: [REFERRAL_STATUS.CONTACTED, REFERRAL_STATUS.SCHEDULED, REFERRAL_STATUS.INELIGIBLE, REFERRAL_STATUS.UNREACHABLE],
    [REFERRAL_STATUS.CONTACTED]: [REFERRAL_STATUS.SCHEDULED, REFERRAL_STATUS.INELIGIBLE, REFERRAL_STATUS.UNREACHABLE],
    [REFERRAL_STATUS.SCHEDULED]: [REFERRAL_STATUS.SCREENED, REFERRAL_STATUS.NO_SHOW, REFERRAL_STATUS.INELIGIBLE],
    [REFERRAL_STATUS.SCREENED]: [REFERRAL_STATUS.RANDOMIZED, REFERRAL_STATUS.INELIGIBLE],
    [REFERRAL_STATUS.RANDOMIZED]: [],
    [REFERRAL_STATUS.INELIGIBLE]: [],
    [REFERRAL_STATUS.UNREACHABLE]: [],
    [REFERRAL_STATUS.NO_SHOW]: []
  });

  // Local fallback to keep the page functional without backend config.
  const FALLBACK_DATA = {
    studies: [
      { id: "study_hope4oa_001", slug: "hope4oa", name: "Trial Stride - A HOPE4OA Study", condition: "Osteoartritis", status: "active" }
    ],
    sites: [
      {
        id: "site_vilo_hou_30",
        name: "Vilo Research Group",
        city: "Houston",
        state: "TX",
        contactName: "Dr. Jorge Mendes",
        contactEmail: "investigators@vitalisportal.com",
        calendarLink: "https://example.com/site-calendar",
        languages: ["es", "en"],
        active: true,
        performanceScore: 82,
        avgTimeToContact: 16,
        screenRate: 46,
        randomizationRate: 22
      }
    ],
    patients: [
      {
        id: "pat_2048",
        firstName: "Matilde",
        lastName: "Peña",
        age: 75,
        gender: "F",
        ethnicity: "Hispana",
        language: "Español",
        zipCode: "77008",
        phone: "+1 346 876 1439",
        email: "matilde.pena@example.com",
        source: "Landing OA"
      }
    ],
    referrals: [
      {
        id: "ref_2048",
        patientId: "pat_2048",
        studyId: "study_hope4oa_001",
        siteId: "site_vilo_hou_30",
        status: REFERRAL_STATUS.NEW_REFERRAL,
        qualificationScore: 9.2,
        qualificationLevel: "high",
        routingScore: 90,
        estimatedValue: 120,
        billingStatus: "pending",
        referredAt: "2026-03-25T10:15:00Z",
        distanceMiles: 3,
        lastUpdated: "2026-03-25T10:15:00Z",
        firstContactAt: null,
        scheduledAt: null,
        screenedAt: null,
        randomizedAt: null,
        flags: ["follow_up_required"],
        notes: ["Pendiente de primer contacto", "Prefiere llamada por la tarde"],
        prescreenerSummary: {
          diagnosisConfirmed: true,
          severityLabel: "Severo (8/10)",
          durationLabel: "7 años",
          priorTreatmentsFailed: true,
          bmi: 29.4,
          exclusionFlags: []
        },
        scheduling: {
          readyThisWeek: true,
          preferredTime: "Tarde (2:00 PM - 5:00 PM)",
          nextAvailableSlot: "Lun 10:30 AM",
          calendarSynced: false
        }
      }
    ]
  };

  // ===== 2) DOM and helpers =====
  const dom = {
    tableBody: document.getElementById("referralsTableBody"),
    searchInput: document.getElementById("searchReferrals"),
    statusFilter: document.getElementById("statusFilter"),
    applyFiltersBtn: document.getElementById("applyFiltersBtn"),
    filterHighScoreBtn: document.getElementById("filterHighScoreBtn"),
    filterNeedsContactBtn: document.getElementById("filterNeedsContactBtn"),
    filterOverdueBtn: document.getElementById("filterOverdueBtn"),
    bulkMarkContactedBtn: document.getElementById("bulkMarkContactedBtn"),
    bulkMarkScheduledBtn: document.getElementById("bulkMarkScheduledBtn"),
    selectAllReferrals: document.getElementById("selectAllReferrals"),
    dashboardState: document.getElementById("dashboardDataState"),
    patientModal: document.getElementById("patientModal"),
    b2bIntakeForm: document.getElementById("b2bIntakeForm"),
    b2bFeedback: document.getElementById("b2bFormFeedback")
  };

  const HOURS_48_MS = 48 * 60 * 60 * 1000;

  function nowISO() {
    return new Date().toISOString();
  }

  function toDate(value) {
    return value instanceof Date ? value : new Date(value);
  }

  function isOlderThanHours(dateValue, hours) {
    return Date.now() - toDate(dateValue).getTime() > hours * 60 * 60 * 1000;
  }

  function isInCurrentWeek(dateValue) {
    const date = toDate(dateValue);
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return date >= start && date < end;
  }

  function formatReferralAge(referredAt) {
    const diffMs = Date.now() - toDate(referredAt).getTime();
    const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (DASHBOARD_LOCALE === "en") return `${days} day${days === 1 ? "" : "s"}`;
    return `${days} día${days > 1 ? "s" : ""}`;
  }

  function average(values) {
    if (!values.length) return 0;
    return values.reduce((sum, item) => sum + item, 0) / values.length;
  }

  function getQualificationClass(level, score) {
    if (level === "high" || score >= 8) return "qualification-high";
    if (level === "medium" || score >= 6) return "qualification-medium";
    return "qualification-low";
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function formatUSD(value) {
    return "$" + Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  // Mirrors the pricing tier in prescreener-submit.js so the dashboard
  // can recalculate estimated_value for any legacy referral that lacks it.
  function pricingFromScore(score) {
    if (score >= 8) return 120;
    if (score >= 5) return 70;
    return 30;
  }

  function isSupabaseReady() {
    const client = window.VITALIS_SUPABASE && window.VITALIS_SUPABASE.getSupabaseClient();
    return Boolean(client);
  }

  function setDashboardState(kind, message) {
    dom.dashboardState.textContent = message || "";
    dom.dashboardState.classList.remove("state-loading", "state-error");
    if (kind === "loading") dom.dashboardState.classList.add("state-loading");
    if (kind === "error") dom.dashboardState.classList.add("state-error");
  }

  function setFormFeedback(message, type) {
    dom.b2bFeedback.textContent = message || "";
    dom.b2bFeedback.classList.remove("feedback-success", "feedback-error");
    if (type === "success") dom.b2bFeedback.classList.add("feedback-success");
    if (type === "error") dom.b2bFeedback.classList.add("feedback-error");
  }

  // ===== 3) State =====
  const appState = {
    studies: [],
    sites: [],
    patients: [],
    referrals: [],
    filters: {
      query: "",
      status: "",
      highScoreOnly: false,
      needsContact: false,
      overdueOnly: false
    },
    ui: { selectedReferralId: null, loading: false, usingFallback: false, selectedReferralIds: new Set() }
  };

  // ===== 4) Data layer (Supabase + fallback) =====
  async function queryTable(tableName, columns) {
    const client = window.VITALIS_SUPABASE.getSupabaseClient();
    if (!client) return [];
    const { data, error } = await client.from(tableName).select(columns);
    if (error) throw error;
    return data || [];
  }

  async function fetchStudies() {
    if (!isSupabaseReady()) return structuredClone(FALLBACK_DATA.studies);
    const rows = await queryTable("studies", "id, slug, name, condition, status");
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      condition: row.condition,
      status: row.status
    }));
  }

  async function fetchSites() {
    if (!isSupabaseReady()) return structuredClone(FALLBACK_DATA.sites);
    const rows = await queryTable(
      "sites",
      "id, name, city, state, contact_name, contact_email, calendar_link, languages, active, performance_score, avg_time_to_contact, screen_rate, randomization_rate"
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      state: row.state,
      contactName: row.contact_name,
      contactEmail: row.contact_email,
      calendarLink: row.calendar_link,
      languages: safeArray(row.languages),
      active: Boolean(row.active),
      performanceScore: Number(row.performance_score || 0),
      avgTimeToContact: Number(row.avg_time_to_contact || 0),
      screenRate: Number(row.screen_rate || 0),
      randomizationRate: Number(row.randomization_rate || 0)
    }));
  }

  async function fetchPatients() {
    if (!isSupabaseReady()) return structuredClone(FALLBACK_DATA.patients);
    const rows = await queryTable(
      "patients",
      "id, first_name, last_name, age, gender, ethnicity, language, zip_code, phone, email, source"
    );
    return rows.map((row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      age: row.age,
      gender: row.gender,
      ethnicity: row.ethnicity,
      language: row.language,
      zipCode: row.zip_code,
      phone: row.phone,
      email: row.email,
      source: row.source
    }));
  }

  async function fetchReferrals() {
    if (!isSupabaseReady()) return structuredClone(FALLBACK_DATA.referrals);
    const rows = await queryTable(
      "referrals",
      "id, patient_id, study_id, site_id, referred_at, distance_miles, status, qualification_score, qualification_level, flags, diagnosis_confirmed, severity_label, duration_label, prior_treatments_failed, bmi, exclusion_flags, ready_this_week, preferred_time, next_available_slot, calendar_synced, notes, prescreener_data, routing_score, estimated_value, billing_status, first_contact_at, scheduled_at, screened_at, randomized_at, last_updated"
    );
    return rows.map((row) => ({
      id: row.id,
      patientId: row.patient_id,
      studyId: row.study_id,
      siteId: row.site_id,
      referredAt: row.referred_at || nowISO(),
      distanceMiles: Number(row.distance_miles || 0),
      status: row.status,
      qualificationScore: Number(row.qualification_score || 0),
      qualificationLevel: row.qualification_level,
      routingScore: Number(row.routing_score || 0),
      estimatedValue: Number(row.estimated_value) || pricingFromScore(Number(row.qualification_score || 0)),
      billingStatus: row.billing_status || "pending",
      lastUpdated: row.last_updated || nowISO(),
      firstContactAt: row.first_contact_at,
      scheduledAt: row.scheduled_at,
      screenedAt: row.screened_at,
      randomizedAt: row.randomized_at,
      flags: safeArray(row.flags),
      notes: safeArray(row.notes),
      prescreenerSummary: {
        diagnosisConfirmed: Boolean(row.diagnosis_confirmed),
        severityLabel: row.severity_label || "N/A",
        durationLabel: row.duration_label || "N/A",
        priorTreatmentsFailed: Boolean(row.prior_treatments_failed),
        bmi: row.bmi || null,
        exclusionFlags: safeArray(row.exclusion_flags)
      },
      scheduling: {
        readyThisWeek: Boolean(row.ready_this_week),
        preferredTime: row.preferred_time || "",
        nextAvailableSlot: row.next_available_slot || "",
        calendarSynced: Boolean(row.calendar_synced)
      }
    }));
  }

  async function updateReferralStatus(referralId, nextStatus, currentReferral) {
    const nextTimestamp = nowISO();
    const updatePayload = {
      status: nextStatus,
      last_updated: nextTimestamp,
      updated_at: nextTimestamp
    };

    if (nextStatus === REFERRAL_STATUS.CONTACTED && !currentReferral.firstContactAt) updatePayload.first_contact_at = nextTimestamp;
    if (nextStatus === REFERRAL_STATUS.SCHEDULED) updatePayload.scheduled_at = nextTimestamp;
    if (nextStatus === REFERRAL_STATUS.SCREENED) updatePayload.screened_at = nextTimestamp;
    if (nextStatus === REFERRAL_STATUS.RANDOMIZED) updatePayload.randomized_at = nextTimestamp;

    if (!isSupabaseReady()) return updatePayload;

    const client = window.VITALIS_SUPABASE.getSupabaseClient();
    const { error } = await client.from("referrals").update(updatePayload).eq("id", referralId);
    if (error) throw error;
    return updatePayload;
  }

  async function createInvestigatorInquiry(payload) {
    const row = {
      site_name: payload.siteName,
      contact_name: payload.contactName,
      email: payload.email,
      study_interest: payload.studyInterest,
      monthly_enrollment_goal: payload.monthlyEnrollmentGoal,
      therapeutic_area: payload.therapeuticArea,
      preferred_contact_method: payload.preferredContactMethod,
      source_page: "para-investigadores",
      submitted_at: nowISO()
    };

    if (!isSupabaseReady()) {
      console.log("investigator_inquiry_fallback", row);
      return { ok: true, fallback: true };
    }

    const client = window.VITALIS_SUPABASE.getSupabaseClient();
    const { error } = await client.from("investigator_inquiries").insert(row);
    if (error) throw error;
    return { ok: true, fallback: false };
  }

  // ===== 5) Derived data =====
  function getPatientById(patientId) {
    return appState.patients.find((patient) => patient.id === patientId) || null;
  }

  function getStudyById(studyId) {
    return appState.studies.find((study) => study.id === studyId) || null;
  }

  function getSiteById(siteId) {
    return appState.sites.find((site) => site.id === siteId) || null;
  }

  function calculatePerformanceScore(avgTimeToContactHours, screenRate, randomizationRate) {
    // Lower contact time is better. Rates are percentages.
    const contactSpeedScore = Math.max(0, Math.min(100, 100 - avgTimeToContactHours * 2));
    const score =
      contactSpeedScore * 0.4 +
      Math.max(0, Math.min(100, screenRate)) * 0.35 +
      Math.max(0, Math.min(100, randomizationRate)) * 0.25;
    return Math.round(score * 10) / 10;
  }

  function getSitePerformanceSnapshot() {
    const bySite = {};
    appState.sites.forEach((site) => {
      bySite[site.id] = {
        site,
        total: 0,
        contactHours: [],
        screened: 0,
        randomized: 0,
        avgTimeToContact: 0,
        screenRate: 0,
        randomizationRate: 0,
        performanceScore: Number(site.performanceScore || 0)
      };
    });

    appState.referrals.forEach((referral) => {
      if (!referral.siteId || !bySite[referral.siteId]) return;
      const bucket = bySite[referral.siteId];
      bucket.total += 1;
      if (referral.firstContactAt) {
        const hours = (toDate(referral.firstContactAt).getTime() - toDate(referral.referredAt).getTime()) / (1000 * 60 * 60);
        if (Number.isFinite(hours) && hours >= 0) bucket.contactHours.push(hours);
      }
      if ([REFERRAL_STATUS.SCREENED, REFERRAL_STATUS.RANDOMIZED].includes(referral.status)) bucket.screened += 1;
      if (referral.status === REFERRAL_STATUS.RANDOMIZED) bucket.randomized += 1;
    });

    const rows = Object.values(bySite).map((item) => {
      const total = Math.max(item.total, 1);
      const avgTimeToContact = item.contactHours.length ? average(item.contactHours) : 0;
      const screenRate = (item.screened / total) * 100;
      const randomizationRate = (item.randomized / total) * 100;
      const performanceScore = calculatePerformanceScore(avgTimeToContact, screenRate, randomizationRate);
      return {
        site: item.site,
        totalReferrals: item.total,
        avgTimeToContact: Math.round(avgTimeToContact * 10) / 10,
        screenRate: Math.round(screenRate * 10) / 10,
        randomizationRate: Math.round(randomizationRate * 10) / 10,
        performanceScore
      };
    });

    rows.sort((a, b) => b.performanceScore - a.performanceScore);
    const topSite = rows[0] || null;
    return { rows, topSite };
  }

  async function syncSitePerformanceScores(snapshot) {
    if (!isSupabaseReady()) return;
    const client = window.VITALIS_SUPABASE.getSupabaseClient();
    if (!client) return;
    try {
      await Promise.all(
        snapshot.rows.map((row) => {
          return client
            .from("sites")
            .update({
              performance_score: row.performanceScore,
              avg_time_to_contact: row.avgTimeToContact,
              screen_rate: row.screenRate,
              randomization_rate: row.randomizationRate,
              updated_at: nowISO()
            })
            .eq("id", row.site.id);
        })
      );
    } catch (error) {
      console.error("site performance sync failed", error);
    }
  }

  function buildAutoContactPayload(patient, referral) {
    if ((referral.qualificationScore || 0) < 7) return null;
    const fullName = `${patient.firstName} ${patient.lastName}`.trim();
    const text = t.autoContactMsg(patient.firstName);
    return {
      referralId: referral.id,
      patientName: fullName,
      phone: patient.phone,
      channels: ["sms", "whatsapp"],
      message: text,
      generatedAt: nowISO()
    };
  }

  function getSlaFlags(referral) {
    const status = referral.status;
    const contactClosedStatuses = [
      REFERRAL_STATUS.CONTACTED,
      REFERRAL_STATUS.SCHEDULED,
      REFERRAL_STATUS.SCREENED,
      REFERRAL_STATUS.RANDOMIZED
    ];
    const scheduleClosedStatuses = [
      REFERRAL_STATUS.SCHEDULED,
      REFERRAL_STATUS.SCREENED,
      REFERRAL_STATUS.RANDOMIZED
    ];

    const contactOverdue = !contactClosedStatuses.includes(status) && isOlderThanHours(referral.referredAt, 24);
    const scheduleOverdue = !scheduleClosedStatuses.includes(status) && isOlderThanHours(referral.referredAt, 72);
    const needsContact = status === REFERRAL_STATUS.NEW_REFERRAL;
    const overdue = contactOverdue || scheduleOverdue;
    return { needsContact, contactOverdue, scheduleOverdue, overdue };
  }

  function getSlaLabels(sla) {
    const labels = [];
    if (sla.contactOverdue) labels.push(t.slaContactChip);
    if (sla.scheduleOverdue) labels.push(t.slaScheduleChip);
    if (!labels.length) labels.push(t.slaOnTrack);
    return labels;
  }

  function buildReferralView(referral) {
    const patient = getPatientById(referral.patientId);
    const study = getStudyById(referral.studyId);
    const site = getSiteById(referral.siteId);
    if (!patient || !study) return null;
    const safeSite = site || { id: "site_unassigned", name: t.unassignedSite, calendarLink: "" };
    const sla = getSlaFlags(referral);
    const contactPayload = buildAutoContactPayload(patient, referral);
    return {
      referral,
      patient,
      study,
      site: safeSite,
      sla,
      slaLabels: getSlaLabels(sla),
      contactPayload,
      patientFullName: `${patient.firstName} ${patient.lastName}`,
      referralAgeLabel: formatReferralAge(referral.referredAt),
      distanceLabel:
        `${referral.distanceMiles} ${referral.distanceMiles === 1 ? t.mileSingular : t.milePlural}`
    };
  }

  function getAllReferralViews() {
    return appState.referrals.map(buildReferralView).filter(Boolean);
  }

  function getFilteredReferralViews() {
    const query = appState.filters.query.trim().toLowerCase();
    const status = appState.filters.status;
    const highScoreOnly = appState.filters.highScoreOnly;
    const needsContact = appState.filters.needsContact;
    const overdueOnly = appState.filters.overdueOnly;
    return getAllReferralViews()
      .filter((view) => {
        const matchesQuery =
          !query ||
          view.patientFullName.toLowerCase().includes(query) ||
          view.patient.id.toLowerCase().includes(query) ||
          view.referral.id.toLowerCase().includes(query);
        const matchesStatus = !status || view.referral.status === status;
        const matchesHighScore = !highScoreOnly || view.referral.qualificationScore >= 8;
        const matchesNeedsContact = !needsContact || view.sla.needsContact;
        const matchesOverdue = !overdueOnly || view.sla.overdue;
        return matchesQuery && matchesStatus && matchesHighScore && matchesNeedsContact && matchesOverdue;
      })
      .sort((a, b) => b.referral.qualificationScore - a.referral.qualificationScore);
  }

  function getKpiSnapshot() {
    const referrals = appState.referrals;
    return {
      newReferrals: referrals.filter((ref) => ref.status === REFERRAL_STATUS.NEW_REFERRAL).length,
      pending48h: referrals.filter((ref) => {
        return ref.status === REFERRAL_STATUS.NEW_REFERRAL && isOlderThanHours(ref.referredAt, 48);
      }).length,
      scheduledThisWeek: referrals.filter((ref) => ref.status === REFERRAL_STATUS.SCHEDULED && isInCurrentWeek(ref.lastUpdated)).length,
      highScorePatients: referrals.filter((ref) => ref.qualificationLevel === "high" || ref.qualificationScore >= 8).length
    };
  }

  function getAccountabilityMetrics() {
    const contactStatuses = [
      REFERRAL_STATUS.CONTACTED,
      REFERRAL_STATUS.SCHEDULED,
      REFERRAL_STATUS.SCREENED,
      REFERRAL_STATUS.RANDOMIZED
    ];
    const contactDurations = appState.referrals
      .filter((ref) => contactStatuses.includes(ref.status))
      .map((ref) => {
        return (toDate(ref.lastUpdated).getTime() - toDate(ref.referredAt).getTime()) / (1000 * 60 * 60);
      })
      .filter((value) => value !== null && value >= 0);

    const activeReferrals = appState.referrals.filter((ref) => ![REFERRAL_STATUS.INELIGIBLE, REFERRAL_STATUS.UNREACHABLE, REFERRAL_STATUS.NO_SHOW].includes(ref.status));
    const totalActive = Math.max(activeReferrals.length, 1);
    const nonCompliant = appState.referrals.filter((ref) => {
      return ref.status === REFERRAL_STATUS.NEW_REFERRAL && isOlderThanHours(ref.referredAt, 48);
    }).length;

    return {
      avgTimeToFirstContactHours: Math.round(average(contactDurations)),
      scheduledPct: Math.round((activeReferrals.filter((ref) => ref.status === REFERRAL_STATUS.SCHEDULED).length / totalActive) * 100),
      screenedPct: Math.round((activeReferrals.filter((ref) => ref.status === REFERRAL_STATUS.SCREENED).length / totalActive) * 100),
      followUpCompliancePct: Math.max(0, Math.round(((appState.referrals.length - nonCompliant) / Math.max(appState.referrals.length, 1)) * 100))
    };
  }

  function getRevenueSnapshot() {
    const referrals = appState.referrals;
    const todayStr = new Date().toDateString();

    const total = referrals.reduce(function (sum, r) { return sum + (r.estimatedValue || 0); }, 0);

    const today = referrals
      .filter(function (r) { return new Date(r.referredAt).toDateString() === todayStr; })
      .reduce(function (sum, r) { return sum + (r.estimatedValue || 0); }, 0);

    // Revenue grouped by studyId
    const byStudy = {};
    referrals.forEach(function (r) {
      if (!byStudy[r.studyId]) byStudy[r.studyId] = 0;
      byStudy[r.studyId] += (r.estimatedValue || 0);
    });

    // Find top study by revenue
    const topStudyEntry = Object.entries(byStudy).sort(function (a, b) { return b[1] - a[1]; })[0] || null;
    const topStudy = topStudyEntry
      ? { id: topStudyEntry[0], revenue: topStudyEntry[1], name: (getStudyById(topStudyEntry[0]) || {}).name || topStudyEntry[0] }
      : null;

    return { total, today, topStudy, byStudy };
  }

  // ===== 6) Render =====
  function renderKpis() {
    const kpis = getKpiSnapshot();
    document.getElementById("kpiNewReferrals").textContent = kpis.newReferrals;
    document.getElementById("kpiPending").textContent = kpis.pending48h;
    document.getElementById("kpiScheduled").textContent = kpis.scheduledThisWeek;
    document.getElementById("kpiHighScore").textContent = kpis.highScorePatients;
  }

  function renderAccountability() {
    const metrics = getAccountabilityMetrics();
    document.getElementById("metricFirstContact").textContent = `${metrics.avgTimeToFirstContactHours || 0}h`;
    document.getElementById("metricScheduled").textContent = `${metrics.scheduledPct}%`;
    document.getElementById("metricScreened").textContent = `${metrics.screenedPct}%`;
    document.getElementById("metricCompliance").textContent = `${metrics.followUpCompliancePct}%`;
  }

  function renderRevenue() {
    const snap = getRevenueSnapshot();
    const totalEl = document.getElementById("kpiTotalRevenue");
    const todayEl = document.getElementById("kpiRevenueToday");
    const studyEl = document.getElementById("kpiRevenueByStudy");
    const studyNameEl = document.getElementById("kpiRevenueStudyName");
    if (totalEl) totalEl.textContent = formatUSD(snap.total);
    if (todayEl) todayEl.textContent = formatUSD(snap.today);
    if (studyEl) studyEl.textContent = snap.topStudy ? formatUSD(snap.topStudy.revenue) : "$0";
    if (studyNameEl) studyNameEl.textContent = snap.topStudy ? snap.topStudy.name : "--";
  }

  function renderSitePerformance() {
    const snapshot = getSitePerformanceSnapshot();
    const topSiteEl = document.getElementById("topSiteName");
    const topScoreEl = document.getElementById("topSiteScore");
    const topContactEl = document.getElementById("topSiteContact");
    const topScreenEl = document.getElementById("topSiteScreen");
    const topRandomEl = document.getElementById("topSiteRandomization");
    const networkPerfEl = document.getElementById("networkPerformanceAvg");

    if (!snapshot.topSite) {
      if (topSiteEl) topSiteEl.textContent = "--";
      if (topScoreEl) topScoreEl.textContent = "--";
      if (topContactEl) topContactEl.textContent = "--";
      if (topScreenEl) topScreenEl.textContent = "--";
      if (topRandomEl) topRandomEl.textContent = "--";
      if (networkPerfEl) networkPerfEl.textContent = "--";
      return;
    }

    const top = snapshot.topSite;
    if (topSiteEl) topSiteEl.textContent = top.site.name;
    if (topScoreEl) topScoreEl.textContent = `${top.performanceScore}`;
    if (topContactEl) topContactEl.textContent = `${top.avgTimeToContact}h`;
    if (topScreenEl) topScreenEl.textContent = `${top.screenRate}%`;
    if (topRandomEl) topRandomEl.textContent = `${top.randomizationRate}%`;
    if (networkPerfEl) {
      const avgNetwork = snapshot.rows.length
        ? Math.round((snapshot.rows.reduce((sum, row) => sum + row.performanceScore, 0) / snapshot.rows.length) * 10) / 10
        : 0;
      networkPerfEl.textContent = `${avgNetwork}`;
    }
  }

  function renderQuickFilterButtons() {
    if (!dom.filterHighScoreBtn || !dom.filterNeedsContactBtn || !dom.filterOverdueBtn) return;
    dom.filterHighScoreBtn.classList.toggle("active", appState.filters.highScoreOnly);
    dom.filterNeedsContactBtn.classList.toggle("active", appState.filters.needsContact);
    dom.filterOverdueBtn.classList.toggle("active", appState.filters.overdueOnly);
  }

  function renderTable() {
    const views = getFilteredReferralViews();
    dom.tableBody.innerHTML = "";

    if (!views.length) {
      dom.tableBody.innerHTML = `<tr><td colspan="11" class="table-empty">${t.tableEmpty}</td></tr>`;
      if (dom.selectAllReferrals) dom.selectAllReferrals.checked = false;
      return;
    }

    views.forEach((view) => {
      const levelLabel =
        view.referral.qualificationLevel === "high"
          ? t.qualHigh
          : view.referral.qualificationLevel === "medium"
            ? t.qualMed
            : t.qualLow;
      const row = document.createElement("tr");
      const billingClass = "billing-" + (view.referral.billingStatus || "pending");
      const selected = appState.ui.selectedReferralIds.has(view.referral.id) ? "checked" : "";
      const slaChips = view.slaLabels
        .map((label) => `<span class="sla-chip ${view.sla.overdue ? "sla-overdue" : "sla-ok"}">${label}</span>`)
        .join("");
      row.innerHTML = `
        <td><input type="checkbox" data-select-referral-id="${view.referral.id}" aria-label="${t.selectReferralAria(view.referral.id)}" ${selected}></td>
        <td><strong>${view.patientFullName}</strong><span class="ref-id">${view.referral.id}</span></td>
        <td>${view.patient.age} ${t.ageSuffix} • ${view.patient.ethnicity}</td>
        <td>${view.distanceLabel}</td>
        <td>${view.referralAgeLabel}</td>
        <td><span class="${STATUS_BADGE_CLASSES[view.referral.status]}">${statusDisplay(view.referral.status)}</span></td>
        <td>${slaChips}</td>
        <td><span class="qualification-chip ${getQualificationClass(view.referral.qualificationLevel, view.referral.qualificationScore)}">${levelLabel}</span></td>
        <td><strong>${view.referral.qualificationScore.toFixed(1)}/10</strong></td>
        <td><strong class="estimated-value">${formatUSD(view.referral.estimatedValue)}</strong><br><span class="billing-badge ${billingClass}">${billingDisplay(view.referral.billingStatus)}</span></td>
        <td><button class="btn-small" type="button" data-referral-id="${view.referral.id}">${t.viewDetail}</button></td>
      `;
      dom.tableBody.appendChild(row);
    });

    if (dom.selectAllReferrals) {
      const visibleIds = views.map((v) => v.referral.id);
      dom.selectAllReferrals.checked = visibleIds.length > 0 && visibleIds.every((id) => appState.ui.selectedReferralIds.has(id));
    }

    dom.tableBody.querySelectorAll("button[data-referral-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        appState.ui.selectedReferralId = btn.dataset.referralId;
        openModal();
        renderModal();
      });
    });

    dom.tableBody.querySelectorAll("input[data-select-referral-id]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const id = checkbox.dataset.selectReferralId;
        if (!id) return;
        if (checkbox.checked) appState.ui.selectedReferralIds.add(id);
        else appState.ui.selectedReferralIds.delete(id);
        if (dom.selectAllReferrals) {
          dom.selectAllReferrals.checked = views.every((v) => appState.ui.selectedReferralIds.has(v.referral.id));
        }
      });
    });
  }

  function renderModalList(id, items) {
    const list = document.getElementById(id);
    list.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
  }

  function getSelectedReferralView() {
    const referral = appState.referrals.find((item) => item.id === appState.ui.selectedReferralId);
    return referral ? buildReferralView(referral) : null;
  }

  function renderModal() {
    const view = getSelectedReferralView();
    if (!view) return;
    const { patient, referral, sla, contactPayload } = view;
    const pres = referral.prescreenerSummary || {};

    document.getElementById("modalPatientName").textContent = `${patient.firstName} ${patient.lastName} (${referral.id})`;
    document.getElementById("modalPatientAge").textContent = `${patient.age} ${t.ageSuffix}`;
    document.getElementById("modalPatientEthnicity").textContent = patient.ethnicity;
    document.getElementById("modalPatientDistance").textContent = `${referral.distanceMiles} ${t.modalMilesWord}`;
    document.getElementById("modalPatientLanguage").textContent = patient.language;
    document.getElementById("modalPatientScore").textContent = `${referral.qualificationScore.toFixed(1)} / 10`;

    const modalValueEl = document.getElementById("modalEstimatedValue");
    const modalBillingEl = document.getElementById("modalBillingStatus");
    if (modalValueEl) modalValueEl.textContent = formatUSD(referral.estimatedValue);
    if (modalBillingEl) {
      modalBillingEl.textContent = billingDisplay(referral.billingStatus);
      modalBillingEl.className = "billing-badge billing-" + (referral.billingStatus || "pending");
    }
    document.getElementById("modalNextSlot").textContent = referral.scheduling.nextAvailableSlot || t.modalPending;
    document.getElementById("modalPreferredTime").textContent = referral.scheduling.preferredTime || t.modalNoPreference;

    const statusEl = document.getElementById("modalPatientStatus");
    statusEl.className = STATUS_BADGE_CLASSES[referral.status];
    statusEl.textContent = statusDisplay(referral.status);

    const qualificationEl = document.getElementById("modalPatientQualification");
    qualificationEl.className = `qualification-chip ${getQualificationClass(referral.qualificationLevel, referral.qualificationScore)}`;
    qualificationEl.textContent =
      referral.qualificationLevel === "high" ? t.qualHigh : referral.qualificationLevel === "medium" ? t.qualMed : t.qualLow;

    const na = t.notAvailable;
    const presItems = [
      t.presDiagnosis(pres.diagnosisConfirmed),
      t.presSeverity(pres.severityLabel || na),
      t.presDuration(pres.durationLabel || na),
      t.presPriorTx(pres.priorTreatmentsFailed),
      t.presBmi(pres.bmi || na)
    ];
    const exclusionFlags = safeArray(pres.exclusionFlags);
    presItems.push(t.presExclusion(exclusionFlags.length ? exclusionFlags.join(", ") : ""));
    renderModalList("modalPrescreenerList", presItems);
    const extraFlags = safeArray(referral.notes).slice();
    if (referral.routingScore) extraFlags.push(t.routingLine(referral.routingScore));
    if (contactPayload) {
      extraFlags.push(t.autoContactLine(contactPayload.phone));
    }
    if (sla.contactOverdue) extraFlags.push(t.slaContactFlag);
    if (sla.scheduleOverdue) extraFlags.push(t.slaScheduleFlag);
    renderModalList("modalFlagsList", extraFlags.length ? extraFlags : [t.noNotes]);

    const waMessage = encodeURIComponent(t.waTemplate(patient.firstName));
    document.getElementById("modalWhatsAppLink").href = `https://wa.me/13468761439?text=${waMessage}`;
  }

  function renderApp() {
    renderKpis();
    renderRevenue();
    renderSitePerformance();
    renderQuickFilterButtons();
    renderAccountability();
    renderTable();
    if (dom.patientModal.getAttribute("aria-hidden") === "false") renderModal();
  }

  // ===== 7) Events =====
  function openModal() {
    dom.patientModal.style.display = "flex";
    dom.patientModal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    dom.patientModal.style.display = "none";
    dom.patientModal.setAttribute("aria-hidden", "true");
  }

  function canTransition(currentStatus, nextStatus) {
    return (ALLOWED_TRANSITIONS[currentStatus] || []).includes(nextStatus);
  }

  function applyStatusUpdateLocally(referral, nextStatus, updatePayload) {
    referral.status = nextStatus;
    referral.lastUpdated = updatePayload.last_updated;
    if (updatePayload.first_contact_at && !referral.firstContactAt) referral.firstContactAt = updatePayload.first_contact_at;
    if (updatePayload.scheduled_at) referral.scheduledAt = updatePayload.scheduled_at;
    if (updatePayload.screened_at) referral.screenedAt = updatePayload.screened_at;
    if (updatePayload.randomized_at) referral.randomizedAt = updatePayload.randomized_at;
  }

  async function transitionReferralStatusById(referralId, nextStatus, options = {}) {
    if (!referralId) return false;
    const silent = Boolean(options.silent);
    const referral = appState.referrals.find((item) => item.id === referralId);
    if (!referral) return false;

    if (!canTransition(referral.status, nextStatus)) {
      if (!silent) setDashboardState("error", t.transitionError);
      return false;
    }

    try {
      const updatePayload = await updateReferralStatus(referralId, nextStatus, referral);
      applyStatusUpdateLocally(referral, nextStatus, updatePayload);
      if (!silent) {
        setDashboardState("", "");
        void syncSitePerformanceScores(getSitePerformanceSnapshot());
        renderApp();
      }
      return true;
    } catch (error) {
      console.error("update status failed", error);
      if (!silent) setDashboardState("error", t.updateStatusError);
      return false;
    }
  }

  async function transitionReferralStatus(nextStatus) {
    const referralId = appState.ui.selectedReferralId;
    await transitionReferralStatusById(referralId, nextStatus);
  }

  async function scheduleNowSelectedReferral() {
    const view = getSelectedReferralView();
    if (!view) return;
    const wasUpdated = await transitionReferralStatusById(view.referral.id, REFERRAL_STATUS.SCHEDULED);
    if (!wasUpdated) return;
    const calendarLink = view.site && view.site.calendarLink ? view.site.calendarLink : "";
    if (calendarLink) window.open(calendarLink, "_blank", "noopener,noreferrer");
    renderApp();
  }

  async function runBulkAction(nextStatus) {
    const selectedIds = Array.from(appState.ui.selectedReferralIds);
    if (!selectedIds.length) {
      setDashboardState("error", t.bulkSelectError);
      return;
    }

    let updated = 0;
    for (const referralId of selectedIds) {
      const ok = await transitionReferralStatusById(referralId, nextStatus, { silent: true });
      if (ok) updated += 1;
    }

    setDashboardState("", t.bulkUpdated(updated));
    void syncSitePerformanceScores(getSitePerformanceSnapshot());
    renderApp();
  }

  function applyFiltersFromUI() {
    appState.filters.query = dom.searchInput.value;
    appState.filters.status = dom.statusFilter.value;
    renderApp();
  }

  function toggleQuickFilter(filterKey) {
    appState.filters[filterKey] = !appState.filters[filterKey];
    renderApp();
  }

  function handleSelectAllVisible() {
    const views = getFilteredReferralViews();
    const shouldSelect = dom.selectAllReferrals.checked;
    views.forEach((view) => {
      if (shouldSelect) appState.ui.selectedReferralIds.add(view.referral.id);
      else appState.ui.selectedReferralIds.delete(view.referral.id);
    });
    renderTable();
  }

  function triggerAutoContactForHighScoreReferrals() {
    getAllReferralViews().forEach((view) => {
      if (view.contactPayload && view.referral.status === REFERRAL_STATUS.NEW_REFERRAL) {
        console.log("auto_contact_payload", view.contactPayload);
      }
    });
  }

  async function handleB2BFormSubmit(event) {
    event.preventDefault();
    setFormFeedback("", "");
    const payload = {
      siteName: document.getElementById("siteName").value.trim(),
      contactName: document.getElementById("contactName").value.trim(),
      email: document.getElementById("contactEmail").value.trim(),
      studyInterest: document.getElementById("studyInterest").value.trim(),
      monthlyEnrollmentGoal: Number(document.getElementById("monthlyGoal").value),
      therapeuticArea: document.getElementById("therapeuticArea").value.trim(),
      preferredContactMethod: document.getElementById("preferredContactMethod").value
    };

    if (!payload.siteName || !payload.contactName || !payload.email || !payload.studyInterest || !payload.therapeuticArea || !payload.preferredContactMethod) {
      setFormFeedback(t.b2bRequired, "error");
      return;
    }
    if (payload.monthlyEnrollmentGoal < 1) {
      setFormFeedback(t.b2bMonthly, "error");
      return;
    }

    try {
      await createInvestigatorInquiry(payload);
      dom.b2bIntakeForm.reset();
      setFormFeedback(t.b2bSuccess, "success");
    } catch (error) {
      console.error("create inquiry failed", error);
      setFormFeedback(t.b2bError, "error");
    }
  }

  function bindEvents() {
    document.getElementById("closePatientModalBtn").addEventListener("click", closeModal);
    dom.patientModal.addEventListener("click", (event) => {
      if (event.target === dom.patientModal) closeModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && dom.patientModal.getAttribute("aria-hidden") === "false") closeModal();
    });

    dom.applyFiltersBtn.addEventListener("click", applyFiltersFromUI);
    dom.searchInput.addEventListener("input", applyFiltersFromUI);
    dom.statusFilter.addEventListener("change", applyFiltersFromUI);

    if (dom.filterHighScoreBtn) dom.filterHighScoreBtn.addEventListener("click", () => toggleQuickFilter("highScoreOnly"));
    if (dom.filterNeedsContactBtn) dom.filterNeedsContactBtn.addEventListener("click", () => toggleQuickFilter("needsContact"));
    if (dom.filterOverdueBtn) dom.filterOverdueBtn.addEventListener("click", () => toggleQuickFilter("overdueOnly"));
    if (dom.selectAllReferrals) {
      dom.selectAllReferrals.setAttribute("aria-label", t.selectAllAria);
      dom.selectAllReferrals.addEventListener("change", handleSelectAllVisible);
    }
    if (dom.bulkMarkContactedBtn) dom.bulkMarkContactedBtn.addEventListener("click", () => runBulkAction(REFERRAL_STATUS.CONTACTED));
    if (dom.bulkMarkScheduledBtn) dom.bulkMarkScheduledBtn.addEventListener("click", () => runBulkAction(REFERRAL_STATUS.SCHEDULED));

    document.getElementById("modalScheduleBtn").addEventListener("click", scheduleNowSelectedReferral);
    document.getElementById("modalMarkContactedBtn").addEventListener("click", () => transitionReferralStatus(REFERRAL_STATUS.CONTACTED));
    document.getElementById("modalMarkScheduledBtn").addEventListener("click", () => transitionReferralStatus(REFERRAL_STATUS.SCHEDULED));
    document.getElementById("modalMarkIneligibleBtn").addEventListener("click", () => transitionReferralStatus(REFERRAL_STATUS.INELIGIBLE));
    document.getElementById("modalMarkUnreachableBtn").addEventListener("click", () => transitionReferralStatus(REFERRAL_STATUS.UNREACHABLE));
    document.getElementById("modalMarkScreenedBtn").addEventListener("click", () => transitionReferralStatus(REFERRAL_STATUS.SCREENED));
    document.getElementById("modalMarkRandomizedBtn").addEventListener("click", () => transitionReferralStatus(REFERRAL_STATUS.RANDOMIZED));

    dom.b2bIntakeForm.addEventListener("submit", handleB2BFormSubmit);
  }

  // ===== 8) Init =====
  async function initApp() {
    bindEvents();
    appState.ui.loading = true;
    setDashboardState("loading", t.loadingReferrals);
    try {
      const [studies, sites, patients, referrals] = await Promise.all([
        fetchStudies(),
        fetchSites(),
        fetchPatients(),
        fetchReferrals()
      ]);
      appState.studies = studies;
      appState.sites = sites;
      appState.patients = patients;
      appState.referrals = referrals;

      appState.ui.usingFallback = !isSupabaseReady();
      if (appState.ui.usingFallback) {
        setDashboardState("", t.fallbackLocal);
      } else {
        setDashboardState("", "");
      }
      void syncSitePerformanceScores(getSitePerformanceSnapshot());
      triggerAutoContactForHighScoreReferrals();
      renderApp();
    } catch (error) {
      console.error("init data load failed", error);
      appState.studies = structuredClone(FALLBACK_DATA.studies);
      appState.sites = structuredClone(FALLBACK_DATA.sites);
      appState.patients = structuredClone(FALLBACK_DATA.patients);
      appState.referrals = structuredClone(FALLBACK_DATA.referrals);
      appState.ui.usingFallback = true;
      setDashboardState("error", t.supabaseLoadError);
      triggerAutoContactForHighScoreReferrals();
      renderApp();
    } finally {
      appState.ui.loading = false;
    }
  }

  initApp();
})();
