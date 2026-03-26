# VITALIS Portal — Patient Recruitment Platform

> Plataforma bilingüe (ES/EN) de reclutamiento de pacientes hispanos para estudios clínicos en Houston, TX.  
> Static HTML · Vanilla JS · Kommo CRM-ready · Sin backend requerido.

---

## Tabla de contenidos

1. [Descripción general](#descripción-general)
2. [Demo & repositorio](#demo--repositorio)
3. [Arquitectura del proyecto](#arquitectura-del-proyecto)
4. [Estructura de archivos](#estructura-de-archivos)
5. [Flujo del paciente](#flujo-del-paciente)
6. [Sistema de traducción i18n](#sistema-de-traducción-i18n)
7. [CRM Adapter & Automatización](#crm-adapter--automatización)
8. [Sistema de referidos & comunidad](#sistema-de-referidos--comunidad)
9. [Dashboard del investigador](#dashboard-del-investigador)
10. [Configuración para producción](#configuración-para-producción)
11. [Despliegue](#despliegue)
12. [Historial de versiones](#historial-de-versiones)
13. [Avisos legales](#avisos-legales)

---

## Descripción general

VITALIS Portal conecta pacientes hispanos en Houston con opciones médicas gratuitas (estudios clínicos). El portal incluye:

- **Landing pages por condición** — rodillas, Pap anormal, ansiedad, lupus, diabetes
- **Pre-screen multi-step** — formulario de calificación rápida con scoring automático
- **Pipeline CRM** — integración con Kommo (Kommo-ready), con fallback a localStorage
- **Sistema de referidos** — puntos VITALIS por cada referido que completa el proceso
- **Soporte bilingüe ES/EN** — sin duplicar páginas, con selector de idioma existente
- **Dashboard operacional** — visibilidad en tiempo real de leads, urgencias y tareas
- **100% estático** — no requiere servidor, funciona en GitHub Pages / Netlify / S3

---

## Demo & repositorio

| | |
|---|---|
| **Repositorio GitHub** | https://github.com/viloc2b-a11y/vitalisusa |
| **Rama principal** | `main` |
| **Último commit** | `d6d0204` — feat: bilingual ES/EN i18n system |

---

## Arquitectura del proyecto

```
Browser
  │
  ├── index.html           ← Landing principal + pre-screen rápido
  ├── pages/*.html         ← 5 landings por condición (multi-step forms)
  ├── gracias.html         ← Página de confirmación post-formulario
  │
  ├── js/i18n.js           ← Language Manager (ES/EN, 208 claves × 2)
  ├── js/crm-adapter.js    ← CRM Adapter v2 + pipeline automation
  ├── js/conversion.js     ← Pre-screen engine (multi-step, scoring)
  ├── js/vitalis-community.js ← Referidos, share, puntos VITALIS
  │
  ├── styles.css           ← Design system principal
  ├── css/conversion.css   ← Estilos del pre-screen
  ├── css/community.css    ← Estilos del sistema de referidos
  │
  ├── i18n/es.json         ← Traducciones ES (referencia canónica)
  ├── i18n/en.json         ← Traducciones EN (referencia canónica)
  │
  └── images/              ← Logo y assets visuales
```

### Flujo de datos

```
Formulario HTML
    │
    ▼
VCrm.buildLeadData()         ← Normaliza datos del formulario
    │
    ▼
VCrm.sendLeadToCRM()         ← Guarda backup en localStorage PRIMERO
    │                             luego intenta envío a Kommo
    ├── Éxito ──► runAutomationAfterCRM()  ← Crea tareas + follow-up
    └── Fallo ──► fallbackAutomation()     ← Queue para reintento
    │
    ▼
redirect → gracias.html      ← Ocurre SIEMPRE (UX no espera al CRM)
```

---

## Estructura de archivos

```
VITALISUSA/
│
├── index.html                        # Home: hero, buscador, pre-screen, condiciones
├── gracias.html                      # Thank-you page (post-formulario, i18n-aware)
├── login.html                        # Acceso al dashboard
├── blog.html                         # Noticias médicas
├── como-funciona.html                # Explicación del proceso
├── para-investigadores.html          # Información para investigadores
├── privacidad.html                   # Política de privacidad
├── dashboard-investigador.html       # Dashboard CRM operacional (admin)
├── dashboard-paciente.html           # Portal del paciente
│
├── pages/
│   ├── dolor-rodillas-houston.html   # Landing: Dolor de rodillas (multi-step 3 pasos)
│   ├── pap-anormal-houston.html      # Landing: Pap anormal
│   ├── ansiedad-houston.html         # Landing: Ansiedad / insomnio
│   ├── lupus-houston.html            # Landing: Lupus
│   └── diabetes-houston.html         # Landing: Diabetes tipo 2
│
├── js/
│   ├── i18n.js                       # Language Manager (ES/EN bilingüe)
│   ├── crm-adapter.js                # CRM Adapter v2 + automation
│   ├── conversion.js                 # Pre-screen engine + lead scoring
│   └── vitalis-community.js          # Referidos, puntos, share
│
├── css/
│   ├── conversion.css                # Estilos del formulario multi-step
│   └── community.css                 # Estilos del sistema de comunidad
│
├── i18n/
│   ├── es.json                       # Traducciones ES (referencia)
│   └── en.json                       # Traducciones EN (referencia)
│
├── images/
│   └── vitalis-logo.png              # Logo principal (52px nav / 64px footer)
│
└── styles.css                        # Design system global
```

---

## Flujo del paciente

### Ruta principal

```
index.html
  └── Pre-screen rápido (condición + edad + ZIP)
        └── pages/[condicion]-houston.html
              └── Multi-step form (3 pasos)
                    └── gracias.html?id=[lead_id]
```

### Ruta directa (URL por condición)

```
/pages/dolor-rodillas-houston.html
/pages/pap-anormal-houston.html
/pages/ansiedad-houston.html
/pages/lupus-houston.html
/pages/diabetes-houston.html
```

Soporte para pre-fill por URL params: `?edad=45&zip=77001`

### Soporte bilingüe en URL

```
/pages/diabetes-houston.html?lang=en   → página en inglés
/index.html?lang=en                    → home en inglés
```

---

## Sistema de traducción i18n

### Arquitectura

Las traducciones están **embebidas directamente en `js/i18n.js`** para garantizar funcionamiento en entornos `file://` y sin build process. Los archivos `i18n/*.json` son la fuente canónica para edición.

### Claves disponibles: 208 por idioma

Categorías principales:

| Prefijo | Sección |
|---|---|
| `nav_*` | Navegación global |
| `home_*` | Home (hero, pre-screen, CTAs) |
| `trust_*` | Trust strip (contadores) |
| `how_*` | Sección "Cómo funciona" |
| `comm_*` | Sección comunidad hispana |
| `cond_*` | Tarjetas de condiciones |
| `test_*` | Testimonios |
| `cta_*` | CTAs finales |
| `footer_*` | Footer (columnas, disclaimer) |
| `form_*` | Campos de formulario (shared) |
| `land_rodillas_*` | Landing rodillas (hero + form) |
| `land_pap_*` | Landing Pap anormal |
| `land_ansiedad_*` | Landing ansiedad |
| `land_lupus_*` | Landing lupus |
| `land_diabetes_*` | Landing diabetes |
| `thanks_*` | gracias.html |

### API pública

```javascript
// Obtener traducción
window.VitalisI18n.t('home_hero_title')

// Cambiar idioma
window.VitalisI18n.setLanguage('en')

// Idioma actual
window.VitalisI18n.getCurrentLanguage()  // 'es' | 'en'

// Reaplicar manualmente (útil tras render dinámico)
window.VitalisI18n.applyTranslations()
```

### Atributos HTML

```html
<!-- Texto -->
<h1 data-i18n="home_hero_title">Encuentra opciones médicas...</h1>

<!-- Placeholder de input -->
<input data-i18n-placeholder="form_name_ph" />

<!-- Aria-label -->
<button data-i18n-aria="search_btn_aria">...</button>

<!-- HTML con markup (para elementos que contienen tags) -->
<p data-i18n-html="cta_sub"></p>

<!-- Option de select -->
<option data-i18n="home_ps_cond_default">Selecciona...</option>
```

### Selector de idioma

El selector `ES | EN` ya existente en el header de `index.html` está conectado mediante atributos `data-lang`:

```html
<div class="lang-switcher">
  <strong data-lang="es">ES</strong> | <a href="#" data-lang="en">EN</a>
</div>
```

Al hacer clic en cualquier opción: actualiza idioma, URL (`?lang=en`), localStorage, y re-renderiza todos los textos sin recargar la página.

### Prioridad de detección

```
?lang=en (URL param)  >  localStorage.vit_lang  >  'es' (default)
```

### Fallback

Si una clave no existe en inglés → usa la versión en español. Si tampoco existe en español → devuelve la clave misma.

---

## CRM Adapter & Automatización

**Archivo:** `js/crm-adapter.js` — CRM Adapter v2.0

### Principios de diseño

- **Provider-agnostic** — Cambiar de Kommo a otro CRM editando solo `CRM_CONFIG.provider`
- **Non-blocking** — La UX nunca espera al CRM; `sendLeadToCRM()` devuelve Promise
- **Resiliente** — Backup en localStorage antes de cualquier llamada de red
- **Automation-ready** — Tareas, follow-ups y etapas de pipeline integradas

### Configuración (`CRM_CONFIG`)

```javascript
// js/crm-adapter.js → CRM_CONFIG
const CRM_CONFIG = {
    provider: 'kommo',
    debug:    true,                         // false en producción
    kommo: {
        domain: 'REPLACE_WITH_YOUR_KOMMO_DOMAIN',  // ej: vilosite.kommo.com
        token:  'REPLACE_IN_PRODUCTION',            // OAuth2 Bearer token
        pipeline: 'Reclutamiento VITALIS',
        fields: {
            condition:       999001,  // ID del campo personalizado en Kommo
            score_label:     999002,
            score_value:     999003,
            referral_source: 999004,
            referral_code:   999005,
            landing_url:     999006,
            campaign:        999007,
            zip_code:        999008,
            language:        999009,  // campo 'language' del lead
            urgency:         999010,
        }
    }
};
```

### Pipeline stages

| Stage | Descripción |
|---|---|
| `Nuevo lead` | Lead acaba de llegar |
| `En revisión` | Equipo revisando elegibilidad |
| `Contactado` | Primer contacto realizado |
| `Pre-calificado` | Pasa criterios iniciales |
| `Cita agendada` | Visita médica programada |
| `En estudio` | Paciente activo |
| `Completado` | Finalizó el estudio |
| `Descalificado` | No cumple criterios |

### Owners por condición

| Condición | Owner asignado | Urgencia |
|---|---|---|
| `rodillas` | Maria López (Coordinadora) | Normal |
| `pap-anormal` | Dr. Sarah Chen (Ginecóloga) | Alta |
| `ansiedad` | Carlos Ruiz (Psicólogo) | Normal |
| `lupus` | Dr. Ana Martínez (Reumatóloga) | Alta |
| `diabetes` | Nurse Practitioner Team | Normal |

### Scoring automático de leads

| Score | Criterio | Urgencia |
|---|---|---|
| **A** (≥30 pts) | Alta coincidencia con criterios de elegibilidad | ALTA |
| **B** (20-29 pts) | Posibilidades iniciales | MEDIA |
| **C** (<20 pts) | Perfil general, revisión estándar | NORMAL |

### API pública (`window.VCrm`)

```javascript
// Construir lead normalizado
const leadData = VCrm.buildLeadData(rawFormData, 'rodillas', { label: 'A', value: 35 });

// Enviar al CRM (non-blocking, con fallback automático)
VCrm.sendLeadToCRM(leadData)
    .then(result  => VCrm.runAutomationAfterCRM(result, leadData))
    .catch(()     => VCrm.fallbackAutomation(leadData))
    .finally(()   => { window.location.href = '../gracias.html?id=' + leadData.metadata.lead_id; });

// Log estructurado
VCrm.logVitalisEvent('form_submitted', { lead_id: 'VPL123', condition: 'lupus' });

// Reintentar leads en cola (pendientes de sync)
VCrm.retryPendingLeadSync();
```

### Estructura del LeadData

```javascript
{
    personal: {
        name:     'María García',
        phone:    '7135550000',
        email:    '',
        city:     'Houston',
        zip:      '77001',
        language: 'es'          // detectado por VitalisI18n
    },
    clinical: {
        condition:    'rodillas',
        symptoms:     'fuerte',
        diagnosis:    'si',
        medications:  '',
        availability: ''
    },
    scoring: { label: 'A', value: 35 },
    source: {
        landing:          '/pages/dolor-rodillas-houston.html',
        campaign:         '',
        ad:               '',
        channel:          'organic',
        referral_source:  'VPL1234567',
        referral_code:    ''
    },
    metadata: {
        created_at: '2026-03-25T...',
        user_agent: '...',
        page_url:   '...',
        lead_id:    'VPL1711234567890'
    },
    status:         'new',
    pipeline_stage: 'Nuevo lead'
}
```

### Resiliencia y fallback

```
sendLeadToCRM()
  │
  ├── ANTES del fetch: guarda en localStorage['vit_pending_leads']
  │
  ├── fetch OK → _markLocalBackupSent(lead_id)
  │                → runAutomationAfterCRM() (tareas + follow-up)
  │
  └── fetch FALLA → queuePendingLead(leadData)
                      → localStorage['vit_pending_lead_queue']
                      → fallbackAutomation() (prepare WA message)
                      → dashboard muestra banner "Reintentar envío"
```

---

## Sistema de referidos & comunidad

**Archivo:** `js/vitalis-community.js`

- Cada usuario tiene un código de referido único (`VPL` + timestamp) guardado en localStorage
- Al completar el proceso, se muestra opción de compartir por WhatsApp con mensaje preformateado
- Los referidos ingresan al sistema con `referral_source` pre-cargado en el lead
- El dashboard del investigador muestra la columna "Referido por"
- Los puntos VITALIS (MVP) se incrementan en localStorage

### Injectar strip de comunidad en una landing

```javascript
if (window.VC) {
    window.VC.injectLandingShare('#wa-strip-container', 'dolor de rodilla');
}
```

---

## Dashboard del investigador

**URL:** `/dashboard-investigador.html` (requiere login)

### KPIs en tiempo real

| KPI | Fuente |
|---|---|
| Leads hoy | `vit_pending_leads` filtrado por fecha |
| Score A urgentes | leads con `scoring.label === 'A'` |
| Referidos | leads con `source.referral_source !== ''` |
| En pipeline | leads con status `in_review` o `contacted` |

### Tabla de pipeline

Columnas: Nombre · Condición · Score/Urgencia · Etapa del pipeline · Owner asignado · Origen · Referido por · Próxima tarea · Acciones (Llamar / Ver)

### Funciones del dashboard

- Filtrar por condición, urgencia y origen
- Exportar CSV con todos los leads
- Banner de reintento si hay leads en cola (`vit_pending_lead_queue`)
- Auto-refresh cada 60 segundos

---

## Configuración para producción

### 1. Conectar Kommo CRM

Editar `js/crm-adapter.js`:

```javascript
const CRM_CONFIG = {
    provider: 'kommo',
    debug:    false,          // deshabilitar logs en producción
    kommo: {
        domain: 'tuempresa.kommo.com',
        token:  'TU_BEARER_TOKEN_OAUTH2',
        // Obtener IDs de campos en Kommo → Configuración → Campos personalizados
        fields: {
            condition:   12345,   // reemplazar con IDs reales
            score_label: 12346,
            language:    12347,
            // ...
        }
    }
};
```

### 2. Crear campos personalizados en Kommo

Ir a **Kommo → Configuración → Campos personalizados → Leads** y crear:

| Campo | Tipo | Uso |
|---|---|---|
| `vitalis_condition` | Text | Condición clínica del lead |
| `vitalis_score_label` | Select (A/B/C) | Clasificación de calidad |
| `vitalis_score_value` | Number | Puntuación numérica |
| `vitalis_referral_source` | Text | Código del referente |
| `vitalis_language` | Select (es/en) | Idioma del paciente |
| `vitalis_urgency` | Select | Nivel de urgencia |
| `vitalis_zip` | Text | Código postal |
| `vitalis_campaign` | Text | UTM campaign |

### 3. Configurar CORS en Kommo

Asegurarse de que el dominio de producción esté en la lista de orígenes permitidos en la app OAuth de Kommo.

### 4. Deshabilitar modo debug

```javascript
// crm-adapter.js
CRM_CONFIG.debug = false;
```

### 5. Variables de entorno (opcional con build tool)

Si se agrega un bundler, las credenciales pueden inyectarse via `.env`:

```
KOMMO_DOMAIN=vilosite.kommo.com
KOMMO_TOKEN=xxxxx
```

### 6. Agregar número de WhatsApp real

Buscar y reemplazar en todos los archivos:

```
13468761439  →  1[TU_NUMERO_WA_REAL]
```

### 7. Configurar Supabase para `para-investigadores.html`

La página de investigadores ya está lista para usar Supabase como fuente de verdad.

#### Opción A (recomendada para estático): runtime config file

Editar `js/supabase-runtime-config.js` antes de desplegar:

```javascript
window.VITALIS_RUNTIME_CONFIG = {
  supabaseUrl: "https://TU-PROYECTO.supabase.co",
  supabaseAnonKey: "TU_SUPABASE_ANON_KEY"
};
```

Notas:
- usar solo `anon key` en frontend
- no usar `service_role` en cliente web
- en CI/CD puedes reemplazar placeholders `__SUPABASE_URL__` y `__SUPABASE_ANON_KEY__`

#### Opción B (fallback): meta tags en `para-investigadores.html`

```html
<meta name="supabase-url" content="https://TU-PROYECTO.supabase.co">
<meta name="supabase-anon-key" content="TU_SUPABASE_ANON_KEY">
```

La app usa prioridad:
1. `window.VITALIS_RUNTIME_CONFIG`
2. `window.__VITALIS_SUPABASE_URL__` / `window.__VITALIS_SUPABASE_ANON_KEY__`
3. meta tags

Si no detecta configuración, carga fallback local de demo sin romper la UI.

---

## Despliegue

### GitHub Pages (recomendado para MVP)

```bash
# El repositorio ya está en GitHub Pages-ready
# Solo habilitar GitHub Pages en:
# Settings → Pages → Branch: main → Folder: / (root)
```

URL resultado: `https://viloc2b-a11y.github.io/vitalisusa/`

### Netlify (alternativa)

```bash
# Drag & drop de la carpeta VITALISUSA en app.netlify.com
# O conectar el repositorio de GitHub directamente
```

### Servidor estático (Apache/Nginx)

```bash
# Copiar todo el contenido de VITALISUSA/ al webroot
cp -r VITALISUSA/* /var/www/html/vitalis/
```

No se requiere ningún build step. El proyecto es 100% vanilla HTML/CSS/JS.

---

## Favicon (MVP)

Actualmente el sitio usa `assets/favicon.svg` como favicon principal.

Para reemplazarlo por un favicon real de producción:

1. Exporta un `favicon.ico` de 32x32 y 16x16.
2. Súbelo a `assets/favicon.ico`.
3. Actualiza los `<head>` para incluir:

```html
<link rel="icon" href="assets/favicon.ico" sizes="any">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
```

En páginas dentro de `pages/` y `blog/`, usa la ruta relativa `../assets/...`.

---

## Historial de versiones

| Commit | Versión | Descripción |
|---|---|---|
| `d6d0204` | v4.0 | Soporte bilingüe ES/EN completo — i18n.js con 208 claves, selector conectado, SEO dinámico |
| `ac66c0c` | v3.1 | Logo VITALIS en las 14 páginas — 52px nav / 64px footer, responsive |
| `990a4b3` | v3.0 | Pipeline automation v2 — CRM adapter completo, dashboard reconstruido con KPIs y badges, gracias.html con messaging dinámico |
| `a16afbb` | v2.0 | CRM adapter layer — Kommo-ready, localStorage backup, fire-and-forget |
| `b62a8e4` | v1.1 | Logo inicial, branding visual |
| `ea13a49` | v1.0 | Plataforma VITALIS inicial — 5 landings, pre-screen, sistema de referidos |

---

## Avisos legales

> **Aviso MVP:** Este es un sitio de demostración. Actualmente no recolectamos ni almacenamos información médica protegida en servidores externos. La versión de producción cumplirá con **HIPAA** y **GDPR**.

> **VITALIS Portal no es un proveedor médico**, no da diagnósticos ni reemplaza la atención de un médico. Todos los estudios mostrados son aprobados por comités de revisión institucional (IRB).

> El hecho de completar un formulario no representa promesa de admisión, tratamiento, compensación ni enrolamiento en ningún estudio. La elegibilidad final es determinada por criterios médicos evaluados por el equipo del estudio.

---

## Stack tecnológico

| Categoría | Tecnología |
|---|---|
| Lenguajes | HTML5, CSS3, Vanilla JavaScript (ES2020) |
| Fuentes | Google Fonts (Inter, Merriweather, Poppins) |
| Iconos | Font Awesome 6.5 |
| CRM target | Kommo (ex amoCRM) |
| Storage local | localStorage, sessionStorage |
| Despliegue | GitHub Pages / Netlify / cualquier CDN estático |
| CI/CD | Git + GitHub (push manual) |
| Sin frameworks | Sin React, Vue, Angular, ni bundlers |

---

*Desarrollado para VITALIS USA — Houston, TX · © 2026 VITALIS Portal*
