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

  const STATUS_LABELS_ES = Object.freeze({
    [REFERRAL_STATUS.NEW_REFERRAL]: "Nuevo",
    [REFERRAL_STATUS.CONTACTED]: "Contactado",
    [REFERRAL_STATUS.SCHEDULED]: "Programado",
    [REFERRAL_STATUS.SCREENED]: "Screening completado",
    [REFERRAL_STATUS.RANDOMIZED]: "Randomizado",
    [REFERRAL_STATUS.INELIGIBLE]: "No elegible",
    [REFERRAL_STATUS.UNREACHABLE]: "No localizable",
    [REFERRAL_STATUS.NO_SHOW]: "No asistió"
  });

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
    [REFERRAL_STATUS.NEW_REFERRAL]: [REFERRAL_STATUS.CONTACTED, REFERRAL_STATUS.INELIGIBLE, REFERRAL_STATUS.UNREACHABLE],
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
        active: true
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
    dashboardState: document.getElementById("dashboardDataState"),
    patientModal: document.getElementById("patientModal"),
    b2bIntakeForm: document.getElementById("b2bIntakeForm"),
    b2bFeedback: document.getElementById("b2bFormFeedback")
  };

  const HOURS_48_MS = 48 * 60 * 60 * 1000;
  const TRANSITION_ERROR_MSG = "Transición no permitida para el estado actual.";

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
    filters: { query: "", status: "" },
    ui: { selectedReferralId: null, loading: false, usingFallback: false }
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
    const rows = await queryTable("sites", "id, name, city, state, contact_name, contact_email, calendar_link, languages, active");
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      state: row.state,
      contactName: row.contact_name,
      contactEmail: row.contact_email,
      calendarLink: row.calendar_link,
      languages: safeArray(row.languages),
      active: Boolean(row.active)
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
      "id, patient_id, study_id, site_id, referred_at, distance_miles, status, qualification_score, qualification_level, flags, diagnosis_confirmed, severity_label, duration_label, prior_treatments_failed, bmi, exclusion_flags, ready_this_week, preferred_time, next_available_slot, calendar_synced, notes, first_contact_at, scheduled_at, screened_at, randomized_at, last_updated"
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

  function buildReferralView(referral) {
    const patient = getPatientById(referral.patientId);
    const study = getStudyById(referral.studyId);
    const site = getSiteById(referral.siteId);
    if (!patient || !study || !site) return null;
    return {
      referral,
      patient,
      study,
      site,
      patientFullName: `${patient.firstName} ${patient.lastName}`,
      referralAgeLabel: formatReferralAge(referral.referredAt),
      distanceLabel: `${referral.distanceMiles} milla${referral.distanceMiles === 1 ? "" : "s"}`
    };
  }

  function getAllReferralViews() {
    return appState.referrals.map(buildReferralView).filter(Boolean);
  }

  function getFilteredReferralViews() {
    const query = appState.filters.query.trim().toLowerCase();
    const status = appState.filters.status;
    return getAllReferralViews().filter((view) => {
      const matchesQuery =
        !query ||
        view.patientFullName.toLowerCase().includes(query) ||
        view.patient.id.toLowerCase().includes(query) ||
        view.referral.id.toLowerCase().includes(query);
      const matchesStatus = !status || view.referral.status === status;
      return matchesQuery && matchesStatus;
    });
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

  function renderTable() {
    const views = getFilteredReferralViews();
    dom.tableBody.innerHTML = "";

    if (!views.length) {
      dom.tableBody.innerHTML = '<tr><td colspan="8" class="table-empty">No hay referrals con estos filtros.</td></tr>';
      return;
    }

    views.forEach((view) => {
      const levelLabel = view.referral.qualificationLevel === "high" ? "Alta" : view.referral.qualificationLevel === "medium" ? "Media" : "Baja";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><strong>${view.patientFullName}</strong><span class="ref-id">${view.referral.id}</span></td>
        <td>${view.patient.age} años • ${view.patient.ethnicity}</td>
        <td>${view.distanceLabel}</td>
        <td>${view.referralAgeLabel}</td>
        <td><span class="${STATUS_BADGE_CLASSES[view.referral.status]}">${STATUS_LABELS_ES[view.referral.status]}</span></td>
        <td><span class="qualification-chip ${getQualificationClass(view.referral.qualificationLevel, view.referral.qualificationScore)}">${levelLabel}</span></td>
        <td><strong>${view.referral.qualificationScore.toFixed(1)}/10</strong></td>
        <td><button class="btn-small" type="button" data-referral-id="${view.referral.id}">Ver detalle</button></td>
      `;
      dom.tableBody.appendChild(row);
    });

    dom.tableBody.querySelectorAll("button[data-referral-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        appState.ui.selectedReferralId = btn.dataset.referralId;
        openModal();
        renderModal();
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
    const { patient, referral } = view;
    const pres = referral.prescreenerSummary || {};

    document.getElementById("modalPatientName").textContent = `${patient.firstName} ${patient.lastName} (${referral.id})`;
    document.getElementById("modalPatientAge").textContent = `${patient.age} años`;
    document.getElementById("modalPatientEthnicity").textContent = patient.ethnicity;
    document.getElementById("modalPatientDistance").textContent = `${referral.distanceMiles} millas`;
    document.getElementById("modalPatientLanguage").textContent = patient.language;
    document.getElementById("modalPatientScore").textContent = `${referral.qualificationScore.toFixed(1)} / 10`;
    document.getElementById("modalNextSlot").textContent = referral.scheduling.nextAvailableSlot || "Pendiente";
    document.getElementById("modalPreferredTime").textContent = referral.scheduling.preferredTime || "Sin preferencia";

    const statusEl = document.getElementById("modalPatientStatus");
    statusEl.className = STATUS_BADGE_CLASSES[referral.status];
    statusEl.textContent = STATUS_LABELS_ES[referral.status];

    const qualificationEl = document.getElementById("modalPatientQualification");
    qualificationEl.className = `qualification-chip ${getQualificationClass(referral.qualificationLevel, referral.qualificationScore)}`;
    qualificationEl.textContent = referral.qualificationLevel === "high" ? "Alta" : referral.qualificationLevel === "medium" ? "Media" : "Baja";

    const presItems = [
      `Diagnóstico confirmado: ${pres.diagnosisConfirmed ? "Sí" : "No"}`,
      `Severidad: ${pres.severityLabel || "N/A"}`,
      `Duración: ${pres.durationLabel || "N/A"}`,
      `Tratamientos previos fallidos: ${pres.priorTreatmentsFailed ? "Sí" : "No"}`,
      `BMI: ${pres.bmi || "N/A"}`
    ];
    const exclusionFlags = safeArray(pres.exclusionFlags);
    presItems.push(exclusionFlags.length ? `Flags de exclusión: ${exclusionFlags.join(", ")}` : "Sin criterios mayores de exclusión.");
    renderModalList("modalPrescreenerList", presItems);
    renderModalList("modalFlagsList", safeArray(referral.notes).length ? referral.notes : ["Sin notas adicionales."]);

    const waMessage = encodeURIComponent(`Hola ${patient.firstName}, te contactamos de VITALIS para coordinar tu screening.`);
    document.getElementById("modalWhatsAppLink").href = `https://wa.me/13468761439?text=${waMessage}`;
  }

  function renderApp() {
    renderKpis();
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

  async function transitionReferralStatus(nextStatus) {
    const referralId = appState.ui.selectedReferralId;
    if (!referralId) return;
    const referral = appState.referrals.find((item) => item.id === referralId);
    if (!referral) return;

    if (!canTransition(referral.status, nextStatus)) {
      setDashboardState("error", TRANSITION_ERROR_MSG);
      return;
    }

    try {
      const updatePayload = await updateReferralStatus(referralId, nextStatus, referral);
      referral.status = nextStatus;
      referral.lastUpdated = updatePayload.last_updated;
      if (updatePayload.first_contact_at && !referral.firstContactAt) referral.firstContactAt = updatePayload.first_contact_at;
      if (updatePayload.scheduled_at) referral.scheduledAt = updatePayload.scheduled_at;
      if (updatePayload.screened_at) referral.screenedAt = updatePayload.screened_at;
      if (updatePayload.randomized_at) referral.randomizedAt = updatePayload.randomized_at;
      setDashboardState("", "");
      renderApp();
    } catch (error) {
      console.error("update status failed", error);
      setDashboardState("error", "No se pudo actualizar el estado. Intenta de nuevo.");
    }
  }

  function applyFiltersFromUI() {
    appState.filters.query = dom.searchInput.value;
    appState.filters.status = dom.statusFilter.value;
    renderApp();
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
      setFormFeedback("Completa todos los campos requeridos.", "error");
      return;
    }
    if (payload.monthlyEnrollmentGoal < 1) {
      setFormFeedback("El objetivo mensual debe ser mayor a 0.", "error");
      return;
    }

    try {
      await createInvestigatorInquiry(payload);
      dom.b2bIntakeForm.reset();
      setFormFeedback("Solicitud enviada. Nuestro equipo te contactará pronto.", "success");
    } catch (error) {
      console.error("create inquiry failed", error);
      setFormFeedback("No se pudo enviar la solicitud. Intenta nuevamente.", "error");
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

    document.getElementById("modalScheduleBtn").addEventListener("click", () => transitionReferralStatus(REFERRAL_STATUS.SCHEDULED));
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
    setDashboardState("loading", "Cargando referrals...");
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
        setDashboardState("", "Vista en modo local (fallback). Configura Supabase para datos en vivo.");
      } else {
        setDashboardState("", "");
      }
      renderApp();
    } catch (error) {
      console.error("init data load failed", error);
      appState.studies = structuredClone(FALLBACK_DATA.studies);
      appState.sites = structuredClone(FALLBACK_DATA.sites);
      appState.patients = structuredClone(FALLBACK_DATA.patients);
      appState.referrals = structuredClone(FALLBACK_DATA.referrals);
      appState.ui.usingFallback = true;
      setDashboardState("error", "No se pudieron cargar datos de Supabase. Mostrando fallback local.");
      renderApp();
    } finally {
      appState.ui.loading = false;
    }
  }

  initApp();
})();
