/**
 * VITALIS i18n — Language Manager (v1.0)
 * ─────────────────────────────────────────────────────────────────────
 * Bilingual support: Español (default) / English
 *
 * Priority:  URL ?lang=en  >  localStorage vit_lang  >  'es' (default)
 * Usage:     Add data-i18n="key" to any HTML element.
 *            Add data-i18n-placeholder="key" to inputs.
 *            Add data-i18n-aria="key" to aria-label attrs.
 *            JS: window.VitalisI18n.t('key')
 * ─────────────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  const DEFAULT_LANG   = 'es';
  const SUPPORTED      = ['es', 'en'];

  // ══════════════════════════════════════════════════════════
  // TRANSLATIONS (embedded — works on file:// and HTTP)
  // Edit i18n/es.json and i18n/en.json as the canonical source.
  // ══════════════════════════════════════════════════════════

  const TRANSLATIONS = {

    /* ── ESPAÑOL ── */
    es: {
      // ── Navigation ─────────────────────────────────────
      nav_how:           'Cómo funciona',
      nav_news:          'Noticias',
      nav_researchers:   'Para investigadores',
      nav_login:         'Iniciar sesión',
      nav_privacy:       'Privacidad',
      lang_es:           'ES',
      lang_en:           'EN',

      // ── Home — Hero ─────────────────────────────────────
      home_hero_eyebrow:  '🏥 Houston, TX — 100% en Español',
      home_hero_title:    'Encuentra opciones médicas para tu dolor en Houston',
      home_hero_sub:      'Si estás sufriendo un dolor o síntoma, puede haber una opción gratuita disponible para ti ahora mismo — con apoyo en español de principio a fin.',
      home_pill_free:     'Sin costo para ti',
      home_pill_comp:     'Posible compensación',
      home_pill_esp:      'Apoyo en español',
      home_cta_qualify:   'Ver si califico ahora',
      home_cta_how:       'Cómo funciona',

      // ── Home — Search card ───────────────────────────────
      search_title:       '¿Cuál es tu dolor o síntoma principal?',
      search_sub:         'Escribe lo que sientes — no necesitas saber el nombre del estudio.',
      search_placeholder: 'Ej: dolor de rodillas, Pap anormal, ansiedad...',
      search_btn_aria:    'Buscar',

      // ── Home — Inline pre-screen ─────────────────────────
      home_ps_title:        '¿Para qué condición quieres opciones?',
      home_ps_sub:          'Cuéntanos y te decimos si hay algo disponible ahora mismo en Houston — gratis, en español',
      home_ps_age_label:    '¿Cuántos años tienes?',
      home_ps_age_ph:       'Tu edad',
      home_ps_zip_label:    'Código postal (ZIP)',
      home_ps_cond_label:   '¿Qué sientes o padeces?',
      home_ps_cond_default: 'Selecciona tu síntoma o condición',
      home_ps_submit:       'Ver si califico →',
      home_ps_urgency:      '⚡ Disponibilidad limitada · Cupos activos en Houston',

      // ── Home — Trust strip ───────────────────────────────
      trust_studies:  'Estudios activos en Houston',
      trust_patients: 'Pacientes atendidos',
      trust_bilingual:'% Atención en español',
      trust_today:    'Te contactamos hoy mismo',

      // ── How it works ─────────────────────────────────────
      how_eyebrow:  'El proceso',
      how_title:    'Así de simple',
      how_sub:      'No necesitas seguro médico. No necesitas saber el nombre del estudio. Solo cuéntanos qué sientes.',
      how_s1_title: 'Busca',
      how_s1_text:  'Cuéntanos qué dolor o síntoma estás viviendo. Usamos eso para encontrar la opción correcta para ti.',
      how_s2_title: 'Postúlate',
      how_s2_text:  'Completa el pre-screen rápido (menos de 60 segundos). Te decimos si tienes buenas posibilidades.',
      how_s3_title: 'Recibe apoyo',
      how_s3_text:  'Si calificas, alguien de nuestro equipo — en español — te contacta en 24 a 48 horas.',

      // ── Community ────────────────────────────────────────
      comm_eyebrow:        'Comunidad hispana en Houston',
      comm_title:          'No estás solo/a',
      comm_sub:            'Miles de familias latinas como la tuya ya están accediendo a nuevas opciones médicas con apoyo cercano y en español. La ciencia también es para nosotros.',
      comm_nearby_title:   'Cerca de ti',
      comm_nearby_text:    'Estudios en Houston y alrededores. Sin viajes largos.',
      comm_language_title: 'En tu idioma',
      comm_language_text:  'Todo el proceso — desde la llamada hasta las visitas — en español.',
      comm_respect_title:  'Con respeto',
      comm_respect_text:   'Estudios aprobados por comités de ética. Tu seguridad primero.',

      // ── Conditions grid ──────────────────────────────────
      cond_eyebrow:      'Opciones activas en Houston',
      cond_title:        '¿Te identificas con alguno de estos?',
      cond_sub:          'Haz clic en tu condición o síntoma para ver si calificas.',
      cond_recruiting:   'Reclutando ahora',
      cond_rodillas:     'Dolor de rodillas',
      cond_rodillas_sub: 'Artritis · Osteoartritis · Dolor al caminar',
      cond_pap:          'Pap anormal',
      cond_pap_sub:      'Resultado preocupante · Prevención cervical',
      cond_ansiedad:     'Ansiedad / nervios',
      cond_ansiedad_sub: 'Preocupación excesiva · Insomnio · Pánico',
      cond_lupus:        'Lupus',
      cond_lupus_sub:    'Brotes · Fatiga extrema · Dolor articular',
      cond_diabetes:     'Diabetes tipo 2',
      cond_diabetes_sub: 'Azúcar descontrolada · Fatiga · Visión borrosa',

      // ── Testimonials ─────────────────────────────────────
      test_eyebrow:  'En primera persona',
      test_title:    'Lo que dicen nuestros pacientes',
      test_1_text:   '"Yo creo que participar va a ser un bien para los pacientes, un bien para la ciencia y un bien para encontrar un nuevo medicamento. Me sentí en familia desde el primer día."',
      test_1_name:   'Maxi R.',
      test_1_place:  'Houston, TX · Paciente voluntario',
      test_2_text:   '"Al principio tenía dudas, pero me explicaron todo en español y me sentí acompañada en cada paso. Hoy me siento mucho mejor y sigo participando."',
      test_2_name:   'Ana López',
      test_2_place:  '62 años · Houston, TX',
      test_3_text:   '"Pensé que solo me quedaba sufrir con el dolor de rodillas. Gracias a VITALIS encontré una opción real y sin costo. No lo podía creer al principio."',
      test_3_name:   'Carlos Mendoza',
      test_3_place:  '58 años · Houston, TX',

      // ── Final CTA ────────────────────────────────────────
      cta_title:   '¿Tienes dudas o quieres más información?',
      cta_sub:     'Nuestro equipo en español está listo. Te contactamos hoy mismo. Sin presión, sin compromiso.',
      cta_wa_btn:  'Hablar ahora con coordinadora en español',
      cta_qualify: 'Ver si califico en 60 segundos',
      wa_tooltip:  '¡Escríbenos en español!',

      // ── Footer ───────────────────────────────────────────
      footer_brand_text:          'Conectando pacientes hispanos con opciones médicas en Houston. Todo en español. Sin costo.',
      footer_col_conditions:      'Condiciones',
      footer_col_platform:        'Plataforma',
      footer_col_legal:           'Legal',
      footer_link_rodillas:       'Dolor de rodillas',
      footer_link_pap:            'Pap anormal',
      footer_link_ansiedad:       'Ansiedad',
      footer_link_lupus:          'Lupus',
      footer_link_diabetes:       'Diabetes tipo 2',
      footer_link_how:            'Cómo funciona',
      footer_link_blog:           'Noticias médicas',
      footer_link_researchers:    'Para investigadores',
      footer_link_login:          'Iniciar sesión',
      footer_link_privacy:        'Política de privacidad',
      footer_link_terms:          'Términos y condiciones',
      footer_link_nondiscrim:     'Aviso de no discriminacion',
      footer_disclaimer:          'Aviso MVP: Este es un sitio de demostración. Actualmente no recolectamos ni almacenamos información médica protegida. La versión final cumplirá con HIPAA y RGPD. VITALIS Portal no es un proveedor médico, no da diagnósticos ni reemplaza la atención de su médico. Todos los estudios mostrados son aprobados por comités de revisión institucional (IRB).',
      footer_copy:                '© 2026 VITALIS Portal',

      // ── Shared form fields ───────────────────────────────
      form_age_label:    '¿Cuántos años tienes?',
      form_age_ph:       'Tu edad',
      form_zip_label:    'Código postal (ZIP)',
      form_name_label:   'Nombre completo',
      form_name_ph:      'Nombre y apellido',
      form_phone_label:  'Teléfono móvil',
      form_phone_ph:     '(713) 555-0000',
      form_back:         'Atrás',
      form_continue:     'Continuar →',
      form_privacy:      'Al hacer clic en "Enviar", aceptas ser contactado por VITALIS Portal para fines informativos sobre estudios clínicos. Tu información está protegida.',
      form_no_insurance: 'No necesitas seguro médico ni estatus legal',
      form_qualify_60s:  'Ver si califico en 60 segundos',

      // ── Landing: Rodillas ─────────────────────────────────
      land_rodillas_eyebrow:      'Dolor de Rodillas / Artritis',
      land_rodillas_hero_title:   '¿Te duelen las rodillas al caminar o subir escaleras?',
      land_rodillas_hero_sub:     'Participa en un estudio clínico en Houston con especialistas. Atención 100% en español. Sin costo para ti.',
      land_rodillas_bullet1:      '✅ Visitas médicas sin costo',
      land_rodillas_bullet2:      '✅ Medicamento del estudio',
      land_rodillas_bullet3:      '✅ Compensación por tiempo',
      land_rodillas_pain_title:   'Entendemos tu dolor',
      land_rodillas_pain1:        'Rigidez en las mañanas que no te deja empezar el día.',
      land_rodillas_pain2:        'Dolor constante al caminar o bajar el escalón de la banqueta.',
      land_rodillas_pain3:        'Dificultad para dormir por la inflamación en tus articulaciones.',
      land_rodillas_option_box:   'Hay una opción para ti en Houston',
      land_rodillas_option_text:  'Especialistas en Houston están buscando voluntarios para probar nuevas opciones médicas que podrían cambiar tu calidad de vida.',
      land_step_basic_title:      'Información básica',
      land_step_basic_sub:        'Todo es confidencial y solo para uso clínico.',
      land_rodillas_q1:           '¿Sufres dolor de rodillas actualmente?',
      land_rodillas_yes:          'SÍ',
      land_rodillas_no:           'NO',
      land_step_pain_title:       'Detalles sobre tu dolor',
      land_step_pain_sub:         'Entender lo que sientes nos ayuda a calificarte mejor.',
      land_rodillas_pain_q:       '¿De qué nivel es tu dolor usualmente? (1-10)',
      land_rodillas_mild:         'Leve (1-4)',
      land_rodillas_medium:       'Medio (5-7)',
      land_rodillas_strong:       'Fuerte (8-10)',
      land_rodillas_treat_q:      '¿Has recibido algún tratamiento previo? (Selecciona todos los que apliquen)',
      land_rodillas_tr_pills:     'Pastillas / Ibuprofeno',
      land_rodillas_tr_inject:    'Inyecciones',
      land_rodillas_tr_physio:    'Fisioterapia / ejercicios',
      land_rodillas_tr_none:      'Ninguno / no sé',
      land_step_contact_title:    'Datos de contacto',
      land_step_contact_sub:      'Te llamaremos en español para confirmarte los detalles.',
      land_rodillas_submit:       'Enviar solicitud →',

      // ── Landing: Pap ─────────────────────────────────────
      land_pap_eyebrow:     'Salud Preventiva / Pap Anormal',
      land_pap_hero_title:  '¿Recibiste un resultado de Pap anormal y no sabes qué sigue?',
      land_pap_hero_sub:    'No tienes que pasar este momento con miedo o dudas. Participa en un programa preventivo en Houston con especialistas. Atención en español. Sin costo.',
      land_pap_bullet1:     '✅ Ginecología especializada',
      land_pap_bullet2:     '✅ Pruebas de seguimiento',
      land_pap_bullet3:     '✅ Todo en tu idioma',
      land_pap_form_title:  'Cuestionario rápido',
      land_pap_form_sub:    'Tu información es privada (HIPAA compliant).',
      land_pap_pap_q:       '¿Hace cuánto fue tu último Pap?',
      land_pap_opt1:        'Menos de 6 meses',
      land_pap_opt2:        '6-12 meses',
      land_pap_opt3:        'Más de un año',
      land_pap_submit:      'Postularme ahora →',

      // ── Landing: Ansiedad ─────────────────────────────────
      land_ansiedad_eyebrow:    'Salud Mental / Ansiedad',
      land_ansiedad_hero_title: '¿Vives con ansiedad constante o problemas para dormir?',
      land_ansiedad_hero_sub:   'No tienes que lidiar con esto a solas. Hay especialistas en Houston ofreciendo nuevas opciones gratuitas en español para pacientes hispanos.',
      land_ansiedad_bullet1:    '✅ Evaluación psicológica',
      land_ansiedad_bullet2:    '✅ Opciones terapéuticas',
      land_ansiedad_bullet3:    '✅ 100% en español',
      land_ansiedad_form_title: 'Inicio de registro',
      land_ansiedad_form_sub:   'Completar este registro no te compromete a nada.',
      land_ansiedad_sleep_q:    '¿Te cuesta trabajo dormir por la ansiedad?',
      land_ansiedad_opt1:       'Sí, casi todas las noches',
      land_ansiedad_opt2:       'A veces',
      land_ansiedad_opt3:       'No',
      land_ansiedad_submit:     'Recibir información →',

      // ── Landing: Lupus ────────────────────────────────────
      land_lupus_eyebrow:    'Enfermedad Autoinmune / Lupus',
      land_lupus_hero_title: '¿Tu Lupus te causa demasiada fatiga y dolor hoy?',
      land_lupus_hero_sub:   'Participa en un estudio en Houston enfocado en pacientes hispanos. Sin costo médico y con especialistas que hablan tu idioma.',
      land_lupus_bullet1:    '✅ Pruebas de laboratorio',
      land_lupus_bullet2:    '✅ Medicamento especializado',
      land_lupus_bullet3:    '✅ Compensación posible',
      land_lupus_diag_q:     '¿Ya tienes un diagnóstico de Lupus?',
      land_lupus_diag_yes:   'SÍ, lo tengo',
      land_lupus_diag_no:    'NO, creo tenerlo',
      land_lupus_submit:     'Hablar con especialista →',

      // ── Landing: Diabetes ─────────────────────────────────
      land_diabetes_eyebrow:    'Diabetes / Salud Metabólica',
      land_diabetes_hero_title: '¿Tu azúcar sigue alta a pesar del tratamiento?',
      land_diabetes_hero_sub:   'Participa en un nuevo programa médico en Houston especializado en nuestra comunidad. Sin costo para ti y con todo el apoyo en español.',
      land_diabetes_bullet1:    '✅ Pruebas de A1C gratuitas',
      land_diabetes_bullet2:    '✅ Medicamentos nuevos',
      land_diabetes_bullet3:    '✅ Sin costo médico',
      land_diabetes_treat_q:    '¿Qué tratamiento tomas actualmente?',
      land_diabetes_treat_ph:   'Ej: Metformina, Insulina, nada...',
      land_diabetes_submit:     'Postularme ahora →',

      // ── Gracias.html ──────────────────────────────────────
      thanks_hero_title:      'Ya recibimos tu información',
      thanks_hero_sub:        'Nuestro equipo la revisará y te contactará pronto para orientarte en español sobre los siguientes pasos.',
      thanks_steps_title:     '¿Qué pasa ahora?',
      thanks_s1_title:        'Revisión interna',
      thanks_s1_text:         'Nuestro equipo revisará tus respuestas para verificar si hay una opción disponible para ti en este momento.',
      thanks_s2_title:        'Te contactaremos en español',
      thanks_s2_text:         'Si hay una opción que podría corresponder a tu perfil, alguien de nuestro equipo te llamará para orientarte sin ningún compromiso de tu parte.',
      thanks_s3_title:        'Tú decides',
      thanks_s3_text:         'En esa llamada te explicaremos todo en detalle. Participar siempre es una decisión tuya, libre y voluntaria.',
      thanks_disclaimer:      'El hecho de haber completado este formulario no representa ninguna promesa de admisión, tratamiento, compensación ni enrolamiento en ningún estudio. La elegibilidad final se determina por criterios médicos evaluados por el equipo del estudio. Todos los estudios son revisados y aprobados por un Comité de Revisión Institucional (IRB).',
      thanks_wa_text:         '¿Prefieres comunicarte por escrito? Puedes escribirnos directamente por WhatsApp en español.',
      thanks_wa_btn:          'Escribir por WhatsApp',
      thanks_comm_title:      '¿Conoces a alguien con un dolor similar en Houston?',
      thanks_comm_sub:        'Si compartes esta página con alguien que también busca opciones médicas, les estarás ayudando. Ganarás puntos VITALIS por cada referido que complete el proceso.',
      thanks_share_wa:        'Compartir por WhatsApp',
      thanks_copy_link:       'Copiar enlace',
      thanks_ref_disclaimer:  'Comparte solo con personas que deseen recibir información sobre opciones médicas. El reconocimiento es por tu tiempo y apoyo comunitario.',
      thanks_back:            '← Volver al inicio',
      thanks_score_a:         'Tus respuestas iniciales indican un perfil que podría corresponder bien con los criterios de elegibilidad. Nos esforzaremos en contactarte pronto.',
      thanks_score_b:         'Tus respuestas muestran posibilidades iniciales. Nuestro equipo revisará tu información con atención.',

      // ── SEO ───────────────────────────────────────────────
      meta_desc_home:     'VITALIS Portal – Encuentra opciones médicas para tu dolor en Houston. Atención 100% en español para pacientes hispanos. Sin costo, posible compensación.',
      page_title_home:    'VITALIS Portal | Opciones médicas para tu dolor en Houston',
    },

    /* ── ENGLISH ── */
    en: {
      // ── Navigation ─────────────────────────────────────
      nav_how:           'How it works',
      nav_news:          'News',
      nav_researchers:   'For investigators',
      nav_login:         'Sign in',
      nav_privacy:       'Privacy',
      lang_es:           'ES',
      lang_en:           'EN',

      // ── Home — Hero ─────────────────────────────────────
      home_hero_eyebrow:  '🏥 Houston, TX — Bilingual Support',
      home_hero_title:    'Find free medical options for your pain in Houston',
      home_hero_sub:      'If you\'re experiencing pain or a symptom, there may be a free option available for you right now — with full bilingual support from start to finish.',
      home_pill_free:     'No cost to you',
      home_pill_comp:     'Possible compensation',
      home_pill_esp:      'Bilingual support',
      home_cta_qualify:   'See if I qualify now',
      home_cta_how:       'How it works',

      // ── Home — Search card ───────────────────────────────
      search_title:       'What is your main pain or symptom?',
      search_sub:         'Type what you feel — you don\'t need to know the study name.',
      search_placeholder: 'E.g.: knee pain, abnormal Pap, anxiety...',
      search_btn_aria:    'Search',

      // ── Home — Inline pre-screen ─────────────────────────
      home_ps_title:        'Which condition do you need options for?',
      home_ps_sub:          'Tell us and we\'ll check if something is available in Houston right now — at no cost',
      home_ps_age_label:    'How old are you?',
      home_ps_age_ph:       'Your age',
      home_ps_zip_label:    'ZIP code',
      home_ps_cond_label:   'What do you feel or suffer from?',
      home_ps_cond_default: 'Select your symptom or condition',
      home_ps_submit:       'See if I qualify →',
      home_ps_urgency:      '⚡ Limited availability · Active spots in Houston',

      // ── Home — Trust strip ───────────────────────────────
      trust_studies:  'Active studies in Houston',
      trust_patients: 'Patients served',
      trust_bilingual:'% Bilingual support',
      trust_today:    'We contact you same day',

      // ── How it works ─────────────────────────────────────
      how_eyebrow:  'The process',
      how_title:    'That simple',
      how_sub:      'No health insurance needed. No need to know the study name. Just tell us what you feel.',
      how_s1_title: 'Search',
      how_s1_text:  'Tell us what pain or symptom you\'re experiencing. We use that to find the right option for you.',
      how_s2_title: 'Apply',
      how_s2_text:  'Complete the quick pre-screen (under 60 seconds). We\'ll tell you if you have good possibilities.',
      how_s3_title: 'Get support',
      how_s3_text:  'If you qualify, someone from our team contacts you within 24 to 48 hours.',

      // ── Community ────────────────────────────────────────
      comm_eyebrow:        'Hispanic community in Houston',
      comm_title:          'You\'re not alone',
      comm_sub:            'Thousands of Latino families like yours are already accessing new medical options with close, bilingual support. Science is for all of us.',
      comm_nearby_title:   'Close to you',
      comm_nearby_text:    'Studies in Houston and surrounding areas. No long trips.',
      comm_language_title: 'In your language',
      comm_language_text:  'The entire process — from the call to the visits — in your language.',
      comm_respect_title:  'With respect',
      comm_respect_text:   'Studies approved by ethics committees. Your safety first.',

      // ── Conditions grid ──────────────────────────────────
      cond_eyebrow:      'Active options in Houston',
      cond_title:        'Do you identify with any of these?',
      cond_sub:          'Click on your condition or symptom to see if you qualify.',
      cond_recruiting:   'Recruiting now',
      cond_rodillas:     'Knee pain',
      cond_rodillas_sub: 'Arthritis · Osteoarthritis · Pain when walking',
      cond_pap:          'Abnormal Pap',
      cond_pap_sub:      'Concerning result · Cervical prevention',
      cond_ansiedad:     'Anxiety / nerves',
      cond_ansiedad_sub: 'Excessive worry · Insomnia · Panic',
      cond_lupus:        'Lupus',
      cond_lupus_sub:    'Flares · Extreme fatigue · Joint pain',
      cond_diabetes:     'Type 2 Diabetes',
      cond_diabetes_sub: 'Uncontrolled sugar · Fatigue · Blurred vision',

      // ── Testimonials ─────────────────────────────────────
      test_eyebrow:  'First-hand accounts',
      test_title:    'What our patients say',
      test_1_text:   '"I believe participating will benefit patients, science, and finding new treatments. I felt at home from day one."',
      test_1_name:   'Maxi R.',
      test_1_place:  'Houston, TX · Volunteer patient',
      test_2_text:   '"At first I had doubts, but they explained everything and I felt supported every step of the way. I feel much better today and I\'m still participating."',
      test_2_name:   'Ana López',
      test_2_place:  '62 years old · Houston, TX',
      test_3_text:   '"I thought I\'d just have to live with my knee pain. Thanks to VITALIS I found a real, free option. I couldn\'t believe it at first."',
      test_3_name:   'Carlos Mendoza',
      test_3_place:  '58 years old · Houston, TX',

      // ── Final CTA ────────────────────────────────────────
      cta_title:   'Have questions or want more information?',
      cta_sub:     'Our bilingual team is ready. We\'ll contact you today. No pressure, no commitment.',
      cta_wa_btn:  'Talk now with a coordinator',
      cta_qualify: 'See if I qualify in 60 seconds',
      wa_tooltip:  'Message us!',

      // ── Footer ───────────────────────────────────────────
      footer_brand_text:          'Connecting patients with free medical options in Houston. Bilingual support. No cost.',
      footer_col_conditions:      'Conditions',
      footer_col_platform:        'Platform',
      footer_col_legal:           'Legal',
      footer_link_rodillas:       'Knee pain',
      footer_link_pap:            'Abnormal Pap',
      footer_link_ansiedad:       'Anxiety',
      footer_link_lupus:          'Lupus',
      footer_link_diabetes:       'Type 2 Diabetes',
      footer_link_how:            'How it works',
      footer_link_blog:           'Medical news',
      footer_link_researchers:    'For investigators',
      footer_link_login:          'Sign in',
      footer_link_privacy:        'Privacy policy',
      footer_link_terms:          'Terms and conditions',
      footer_link_nondiscrim:     'Non-discrimination notice',
      footer_disclaimer:          'MVP Notice: This is a demonstration site. We do not currently collect or store protected medical information. VITALIS Portal is not a medical provider, does not give diagnoses, and does not replace your doctor\'s care. All studies shown are approved by Institutional Review Boards (IRB).',
      footer_copy:                '© 2026 VITALIS Portal',

      // ── Shared form fields ───────────────────────────────
      form_age_label:    'How old are you?',
      form_age_ph:       'Your age',
      form_zip_label:    'ZIP code',
      form_name_label:   'Full name',
      form_name_ph:      'First and last name',
      form_phone_label:  'Mobile phone',
      form_phone_ph:     '(713) 555-0000',
      form_back:         'Back',
      form_continue:     'Continue →',
      form_privacy:      'By clicking "Submit", you agree to be contacted by VITALIS Portal for informational purposes about clinical studies. Your information is protected.',
      form_no_insurance: 'No health insurance or legal status required',
      form_qualify_60s:  'See if I qualify in 60 seconds',

      // ── Landing: Rodillas ─────────────────────────────────
      land_rodillas_eyebrow:      'Knee Pain / Arthritis',
      land_rodillas_hero_title:   'Does knee pain make it hard to walk or climb stairs?',
      land_rodillas_hero_sub:     'Join a clinical study in Houston with specialists. 100% bilingual support. No cost to you.',
      land_rodillas_bullet1:      '✅ Free medical visits',
      land_rodillas_bullet2:      '✅ Study medication',
      land_rodillas_bullet3:      '✅ Compensation for your time',
      land_rodillas_pain_title:   'We understand your pain',
      land_rodillas_pain1:        'Morning stiffness that doesn\'t let you start your day.',
      land_rodillas_pain2:        'Constant pain when walking or stepping off curbs.',
      land_rodillas_pain3:        'Difficulty sleeping due to joint inflammation.',
      land_rodillas_option_box:   'There is an option for you in Houston',
      land_rodillas_option_text:  'Specialists in Houston are looking for volunteers to test new medical options that could change your quality of life.',
      land_step_basic_title:      'Basic information',
      land_step_basic_sub:        'Everything is confidential and for clinical use only.',
      land_rodillas_q1:           'Are you currently experiencing knee pain?',
      land_rodillas_yes:          'YES',
      land_rodillas_no:           'NO',
      land_step_pain_title:       'Details about your pain',
      land_step_pain_sub:         'Understanding what you feel helps us qualify you better.',
      land_rodillas_pain_q:       'What is your usual pain level? (1-10)',
      land_rodillas_mild:         'Mild (1-4)',
      land_rodillas_medium:       'Moderate (5-7)',
      land_rodillas_strong:       'Severe (8-10)',
      land_rodillas_treat_q:      'Have you received any prior treatment? (Select all that apply)',
      land_rodillas_tr_pills:     'Pills / Ibuprofen',
      land_rodillas_tr_inject:    'Injections',
      land_rodillas_tr_physio:    'Physical therapy / exercises',
      land_rodillas_tr_none:      'None / don\'t know',
      land_step_contact_title:    'Contact information',
      land_step_contact_sub:      'We\'ll call you in your language to confirm the details.',
      land_rodillas_submit:       'Submit →',

      // ── Landing: Pap ─────────────────────────────────────
      land_pap_eyebrow:     'Preventive Health / Abnormal Pap',
      land_pap_hero_title:  'Did you get an abnormal Pap result and don\'t know what comes next?',
      land_pap_hero_sub:    'You don\'t have to face this with fear or uncertainty. Join a preventive program in Houston with specialists. Bilingual care. No cost.',
      land_pap_bullet1:     '✅ Specialized gynecology',
      land_pap_bullet2:     '✅ Follow-up testing',
      land_pap_bullet3:     '✅ In your language',
      land_pap_form_title:  'Quick questionnaire',
      land_pap_form_sub:    'Your information is private (HIPAA compliant).',
      land_pap_pap_q:       'When was your last Pap smear?',
      land_pap_opt1:        'Less than 6 months ago',
      land_pap_opt2:        '6-12 months ago',
      land_pap_opt3:        'More than a year ago',
      land_pap_submit:      'Apply now →',

      // ── Landing: Ansiedad ─────────────────────────────────
      land_ansiedad_eyebrow:    'Mental Health / Anxiety',
      land_ansiedad_hero_title: 'Do you live with constant anxiety or trouble sleeping?',
      land_ansiedad_hero_sub:   'You don\'t have to deal with this alone. Specialists in Houston are offering new free options in your language for patients in our community.',
      land_ansiedad_bullet1:    '✅ Psychological evaluation',
      land_ansiedad_bullet2:    '✅ Therapeutic options',
      land_ansiedad_bullet3:    '✅ 100% bilingual',
      land_ansiedad_form_title: 'Registration',
      land_ansiedad_form_sub:   'Completing this registration does not commit you to anything.',
      land_ansiedad_sleep_q:    'Does anxiety make it hard to sleep?',
      land_ansiedad_opt1:       'Yes, almost every night',
      land_ansiedad_opt2:       'Sometimes',
      land_ansiedad_opt3:       'No',
      land_ansiedad_submit:     'Receive information →',

      // ── Landing: Lupus ────────────────────────────────────
      land_lupus_eyebrow:    'Autoimmune Disease / Lupus',
      land_lupus_hero_title: 'Is your Lupus causing extreme fatigue and pain today?',
      land_lupus_hero_sub:   'Join a study in Houston focused on our community. No medical cost and specialists who speak your language.',
      land_lupus_bullet1:    '✅ Laboratory testing',
      land_lupus_bullet2:    '✅ Specialized medication',
      land_lupus_bullet3:    '✅ Possible compensation',
      land_lupus_diag_q:     'Do you already have a Lupus diagnosis?',
      land_lupus_diag_yes:   'YES, I have one',
      land_lupus_diag_no:    'NO, I think I might have it',
      land_lupus_submit:     'Talk to a specialist →',

      // ── Landing: Diabetes ─────────────────────────────────
      land_diabetes_eyebrow:    'Diabetes / Metabolic Health',
      land_diabetes_hero_title: 'Is your blood sugar still high despite treatment?',
      land_diabetes_hero_sub:   'Join a new medical program in Houston specialized for our community. No cost to you and full bilingual support.',
      land_diabetes_bullet1:    '✅ Free A1C tests',
      land_diabetes_bullet2:    '✅ New medications',
      land_diabetes_bullet3:    '✅ No medical cost',
      land_diabetes_treat_q:    'What treatment are you currently taking?',
      land_diabetes_treat_ph:   'E.g.: Metformin, Insulin, none...',
      land_diabetes_submit:     'Apply now →',

      // ── Gracias.html ──────────────────────────────────────
      thanks_hero_title:      'We received your information',
      thanks_hero_sub:        'Our team will review it and contact you soon to guide you in English or Spanish.',
      thanks_steps_title:     'What happens next?',
      thanks_s1_title:        'Internal review',
      thanks_s1_text:         'Our team will review your answers to verify if there\'s an option available for you right now.',
      thanks_s2_title:        'We\'ll contact you',
      thanks_s2_text:         'If there\'s an option that could match your profile, someone from our team will call to guide you with no commitment on your part.',
      thanks_s3_title:        'You decide',
      thanks_s3_text:         'On that call we\'ll explain everything in detail. Participating is always your decision, free and voluntary.',
      thanks_disclaimer:      'Completing this form does not represent any promise of admission, treatment, compensation, or enrollment in any study. Final eligibility is determined by medical criteria evaluated by the study team. All studies are reviewed and approved by an Institutional Review Board (IRB).',
      thanks_wa_text:         'Prefer to communicate in writing? You can message us directly on WhatsApp.',
      thanks_wa_btn:          'Message on WhatsApp',
      thanks_comm_title:      'Do you know someone in Houston with a similar condition?',
      thanks_comm_sub:        'If you share this page with someone also looking for medical options, you\'ll be helping them. You\'ll earn VITALIS points for each successful referral.',
      thanks_share_wa:        'Share on WhatsApp',
      thanks_copy_link:       'Copy link',
      thanks_ref_disclaimer:  'Share only with people who want to receive information about medical options. Recognition is for your time and community support.',
      thanks_back:            '← Back to home',
      thanks_score_a:         'Your initial answers indicate a profile that could match the eligibility criteria well. We\'ll make every effort to contact you soon.',
      thanks_score_b:         'Your answers show initial possibilities. Our team will review your information carefully.',

      // ── SEO ───────────────────────────────────────────────
      meta_desc_home:     'VITALIS Portal – Find free medical options for your pain in Houston. Bilingual care for Hispanic patients. No cost, possible compensation.',
      page_title_home:    'VITALIS Portal | Free medical options for your pain in Houston',
    }
  };

  // ══════════════════════════════════════════════════════════
  // LANGUAGE DETECTION
  // ══════════════════════════════════════════════════════════

  function getCurrentLanguage() {
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang && SUPPORTED.includes(urlLang)) return urlLang;
    const stored = localStorage.getItem('vit_lang');
    if (stored && SUPPORTED.includes(stored)) return stored;
    return DEFAULT_LANG;
  }

  // ══════════════════════════════════════════════════════════
  // TRANSLATE
  // ══════════════════════════════════════════════════════════

  function t(key, lang) {
    const l   = lang || getCurrentLanguage();
    const obj = TRANSLATIONS[l];
    if (obj && obj[key] !== undefined) return obj[key];
    if (l !== DEFAULT_LANG && TRANSLATIONS[DEFAULT_LANG][key] !== undefined) {
      return TRANSLATIONS[DEFAULT_LANG][key]; // Spanish fallback
    }
    return key; // Last resort: return key itself
  }

  // ══════════════════════════════════════════════════════════
  // APPLY TRANSLATIONS TO DOM
  // ══════════════════════════════════════════════════════════

  function applyTranslations(lang) {
    const l = lang || getCurrentLanguage();

    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const val = t(el.dataset.i18n, l);
      if (val !== el.dataset.i18n) el.textContent = val;
    });

    // Placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const val = t(el.dataset.i18nPlaceholder, l);
      if (val) el.placeholder = val;
    });

    // Aria-label
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const val = t(el.dataset.i18nAria, l);
      if (val) el.setAttribute('aria-label', val);
    });

    // HTML content (for elements that contain markup)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const val = t(el.dataset.i18nHtml, l);
      if (val) el.innerHTML = val;
    });

    // <option> elements in selects
    document.querySelectorAll('option[data-i18n]').forEach(el => {
      const val = t(el.dataset.i18n, l);
      if (val !== el.dataset.i18n) el.textContent = val;
    });
  }

  // ══════════════════════════════════════════════════════════
  // SET LANGUAGE
  // ══════════════════════════════════════════════════════════

  function setLanguage(lang) {
    if (!SUPPORTED.includes(lang)) return;
    localStorage.setItem('vit_lang', lang);

    // Update ?lang= URL param without reload
    const url = new URL(window.location.href);
    if (lang !== DEFAULT_LANG) url.searchParams.set('lang', lang);
    else url.searchParams.delete('lang');
    window.history.replaceState({}, '', url.toString());

    // Apply translations
    applyTranslations(lang);
    document.documentElement.lang = lang;
    _updateSelectorUI(lang);
    _updateSEO(lang);

    // Notify CRM adapter if available
    if (window.VCrm) window.VCrm.logVitalisEvent('language_changed', { lang });
  }

  // ══════════════════════════════════════════════════════════
  // UPDATE SELECTOR UI — no new buttons, just update existing
  // ══════════════════════════════════════════════════════════

  function _updateSelectorUI(lang) {
    document.querySelectorAll('.lang-switcher [data-lang]').forEach(el => {
      const isActive = el.dataset.lang === lang;
      el.style.fontWeight   = isActive ? '800' : '400';
      el.style.opacity      = isActive ? '1'   : '0.65';
      el.style.pointerEvents = isActive ? 'none' : 'auto';
      el.style.cursor        = isActive ? 'default' : 'pointer';
      if (isActive) el.setAttribute('aria-current', 'true');
      else          el.removeAttribute('aria-current');
    });
  }

  // ══════════════════════════════════════════════════════════
  // SEO — update html[lang], title, meta description
  // ══════════════════════════════════════════════════════════

  function _updateSEO(lang) {
    document.documentElement.lang = lang;

    const titleEl = document.querySelector('title[data-i18n]');
    if (titleEl) {
      const val = t(titleEl.dataset.i18n, lang);
      if (val !== titleEl.dataset.i18n) titleEl.textContent = val;
    }

    const metaDesc = document.querySelector('meta[name="description"][data-i18n]');
    if (metaDesc) {
      const val = t(metaDesc.dataset.i18n, lang);
      if (val) metaDesc.setAttribute('content', val);
    }
  }

  // ══════════════════════════════════════════════════════════
  // WIRE EXISTING SELECTOR — attach click handlers to [data-lang]
  // ══════════════════════════════════════════════════════════

  function _initSelector() {
    document.querySelectorAll('[data-lang]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        setLanguage(el.dataset.lang);
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════════════════

  document.addEventListener('DOMContentLoaded', () => {
    _initSelector();
    const lang = getCurrentLanguage();
    applyTranslations(lang);
    document.documentElement.lang = lang;
    _updateSelectorUI(lang);
    _updateSEO(lang);
  });

  // ══════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════
  window.VitalisI18n = {
    t,
    setLanguage,
    getCurrentLanguage,
    applyTranslations,
    TRANSLATIONS,
  };

})();
