(function initPrescreenerForm(global) {
  "use strict";

  // Collects all named form values into a flat object.
  // Checkboxes become arrays; radio/text/select become strings.
  function collectAnswers(form) {
    const answers = {};
    form.querySelectorAll("[name]").forEach(function (el) {
      const name = el.name;
      if (el.type === "checkbox") {
        if (!Array.isArray(answers[name])) answers[name] = [];
        if (el.checked) answers[name].push(el.value);
      } else if (el.type === "radio") {
        if (el.checked) answers[name] = el.value;
      } else {
        answers[name] = el.value;
      }
    });
    return answers;
  }

  function setFeedback(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.className = "prescreener-feedback" + (type ? " prescreener-feedback--" + type : "");
    el.hidden = !message;
  }

  // Wires range inputs that have data-display-id to update a sibling element.
  function wireRangeDisplays(form) {
    form.querySelectorAll("input[type=range][data-display-id]").forEach(function (range) {
      const display = document.getElementById(range.dataset.displayId);
      if (!display) return;
      function update() { display.textContent = range.value + " / 10"; }
      range.addEventListener("input", update);
      update();
    });
  }

  async function handleSubmit(form, feedbackEl, e) {
    e.preventDefault();

    if (!global.VITALIS_PRESCREENER) {
      setFeedback(feedbackEl, form.dataset.errorMessage || "Service unavailable. Please try again later.", "error");
      return;
    }

    const submitBtn = form.querySelector("[type=submit]");
    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = submitBtn.dataset.loadingText || "Sending...";
    }
    setFeedback(feedbackEl, "", null);

    const allAnswers = collectAnswers(form);

    const formData = {
      firstName: allAnswers.firstName || "",
      lastName: allAnswers.lastName || "",
      phone: allAnswers.phone || "",
      email: allAnswers.email || "",
      zipCode: allAnswers.zipCode || "",
      age: allAnswers.age || "",
      gender: allAnswers.gender || null,
      ethnicity: null,
      language: allAnswers.language || "es",
      condition: form.dataset.condition || "",
      source: form.dataset.source || ("prescreener:" + (form.dataset.condition || "unknown")),
      answers: allAnswers
    };

    try {
      let sites = [];
      const client =
        global.VITALIS_SUPABASE && typeof global.VITALIS_SUPABASE.getSupabaseClient === "function"
          ? global.VITALIS_SUPABASE.getSupabaseClient()
          : null;
      if (client) {
        const { data } = await client
          .from("sites")
          .select("id, name, languages, active, performance_score")
          .eq("active", true);
        sites = data || [];
      }

      const result = await global.VITALIS_PRESCREENER.submitPrescreener(formData, {
        studyId: form.dataset.studyId || null,
        sites: sites
      });

      if (result.ok) {
        form.hidden = true;
        const msg =
          form.dataset.successMessage ||
          "Thank you! Our team will follow up with you within 24 hours.";
        setFeedback(feedbackEl, msg, "success");
      }
    } catch (err) {
      console.error("[VITALIS] prescreener submit error", err);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
      const msg =
        form.dataset.errorMessage ||
        "Something went wrong. Please try again or call us directly.";
      setFeedback(feedbackEl, msg, "error");
    }
  }

  function init() {
    document.querySelectorAll(".vitalis-prescreener-form").forEach(function (form) {
      const feedbackId = form.dataset.feedbackId || "prescreenerFeedback";
      const feedbackEl = document.getElementById(feedbackId);
      wireRangeDisplays(form);
      form.addEventListener("submit", handleSubmit.bind(null, form, feedbackEl));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
