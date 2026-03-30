# MATCHING ENGINE — SOP

## Objetivo
Motor de reglas que recibe el state del pre-screener y retorna: estudio asignado, prioridad del lead, acción del coordinador, posición en queue, y mensaje al paciente.

## Alcance
### Qué es
- Matching paciente → estudio por reglas de inclusión/exclusión
- Scoring determinista por puntos (max 15)
- Routing a acción de coordinador (call 2h / call 24h / store and nurture)
- Queue ranking (urgent=1, standard=3, nurture=9)
- Mensajes en español (default) e inglés

### Qué no es
- No es ML ni AI
- No hace inserts a Supabase (pure logic)
- No renderiza UI
- No crea tablas nuevas

## Contrato (OBLIGATORIO)
### Inputs
- Fuente: state object del pre-screener
- Formato esperado:
  ```
  { sintoma, duracion, edad, ubicacion, dx, disponibilidad, idioma }
  ```
- Validaciones previas: edad debe ser número, ubicacion 'fuera' → score 0 directo

### Outputs
- Artefacto: objeto JS retornado por `buildEngineOutput(state, studies)`
- Formato:
  ```
  { study_id, match, priority, score, action, reason, message, queue_rank, queue_label, engine_version }
  ```
- Criterios de aceptación:
  - [x] (CRITICAL) `matchStudies` filtra por inclusión/exclusión correctamente
  - [x] (CRITICAL) `scoreLead` genera score con los valores exactos del spec
  - [x] (CRITICAL) `routeLead` recibe scoreResult y asigna action correcta
  - [x] (CRITICAL) `getQueuePriority` retorna rank y label correctos
  - [x] (CRITICAL) `getResultMessage` usa matched como parámetro
  - [x] (CRITICAL) No hace inserts a DB ni renderiza UI
  - [x] (NON-CRITICAL) Mensajes en español por defecto

### Invariantes / Idempotencia
- Mismos inputs → mismos outputs siempre
- No side effects
- `ubicacion === 'fuera'` → score 0, priority waitlist (hard fail)

## Flujo
1. `matchStudies(state, studies)` → filtra estudios activos por reglas
2. `scoreLead(state)` → calcula score + priority label
3. `routeLead(state, matchedStudies, scoreResult)` → selecciona estudio + acción
4. `getQueuePriority(priority, action)` → queue_rank + queue_label
5. `getResultMessage(priority, idioma, matched)` → mensaje al paciente
6. `buildEngineOutput(state, studies)` → orquesta 1-5, retorna objeto final

## Scoring Table
| Signal | Value | Points |
|--------|-------|--------|
| disponibilidad | flexible/manana/tarde/fin_semana | +3 |
| disponibilidad | nomas_saber | +1 |
| sintoma | varios | +3 |
| sintoma | caminar/escaleras/hinchon | +2 |
| sintoma | rigidez | +1 |
| ubicacion | cerca | +3 |
| ubicacion | lejos | +1 |
| ubicacion | fuera | → score 0 (hard fail) |
| duracion | mas3a | +3 |
| duracion | 1a3a | +2 |
| dx | artritis | +3 |
| dx | revisado | +1 |

## Restricciones / Casos borde (Memoria viva)
- Nota: Si `edad` es string, parsear a int con `parseInt(state.edad, 10)`.
- Nota: Si `ubicacion === 'fuera'` → siempre score=0 y priority=waitlist.
- Nota: Si no hay estudios activos → retornar waitlist con match=false.
- Nota: `disponibilidad === 'nomas_saber'` da +1 (no +3), refleja bajo compromiso.
- Nota: `duracion mas3a` da +3 (no +2), refleja cronicidad severa.
- Nota: `sintoma caminar/escaleras/hinchon` dan +2 (no +1), son señales fuertes.

## Observabilidad
- Log path: consola del browser (console.debug)
- Señales de éxito: test-matching-engine.html muestra 4/4 PASS
- Señales de fracaso: cualquier test FAIL o error en consola
