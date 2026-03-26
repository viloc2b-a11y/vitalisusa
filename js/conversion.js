/**
 * VITALIS Conversion Logic (v1.0)
 * Logic for pre-screen, scoring, storage, and redirection.
 */

const VITALIS = (function() {
    'use strict';

    // Clinical Scoring Rules (Demographics & Conditions)
    const SCORING = {
        AGE: { min: 18, max: 75, points: 10 },
        SINTOMAS: {
            rodilla: { intensity_high: 20, intensity_med: 10, intensity_low: 5 },
            ansiedad: { frecuency_high: 20, frecuency_med: 10 },
            lupus: { diagnosed: 30, suspected: 15 },
            diabetes: { diagnosed_t2: 30, prediabetes: 15 }
        }
    };

    // Lead capturing
    const captureLead = (data) => {
        const lead = {
            id: 'VPL' + Date.now(),
            date: new Date().toISOString(),
            status: 'NEW',
            score: calculateScore(data),
            ...data
        };
        
        // Local storage as temporary DB (simulating backend)
        const allLeads = JSON.parse(localStorage.getItem('vit_leads') || '[]');
        allLeads.push(lead);
        localStorage.setItem('vit_leads', JSON.stringify(allLeads));
        
        return lead;
    };

    const calculateScore = (data) => {
        let score = 0;
        
        // Age validation
        const age = parseInt(data.edad);
        if (age >= SCORING.AGE.min && age <= SCORING.AGE.max) score += SCORING.AGE.points;

        // Logic by condition (if available)
        if (data.pre_questions) {
            // Simplified sum of selected clinical triggers
            score += (Object.keys(data.pre_questions).length * 10);
        }

        return score;
    };

    // Pre-screen UI Controller
    const initPreScreen = (formConfig) => {
        const { formId, steps, onComplete } = formConfig;
        const form = document.getElementById(formId);
        if (!form) return;

        let currentStep = 1;
        const totalSteps = steps.length;

        const updateUI = () => {
            // Hide all steps
            document.querySelectorAll('.prescreen-step').forEach(s => s.classList.remove('visible'));
            // Show current
            document.getElementById(`step-${currentStep}`).classList.add('visible');
            // Update progress bar
            const bar = document.querySelector('.progress-bar-fill');
            if (bar) bar.style.width = `${(currentStep / totalSteps) * 100}%`;
            
            // Update step dots
            document.querySelectorAll('.step-dot').forEach((dot, idx) => {
                const stepIdx = idx + 1;
                if (stepIdx === currentStep) dot.className = 'step-dot active';
                else if (stepIdx < currentStep) dot.className = 'step-dot done';
                else dot.className = 'step-dot';
            });
        };

        // Event for radio buttons (auto-advance on some steps)
        form.querySelectorAll('.radio-card').forEach(card => {
            card.onclick = () => {
                const group = card.parentElement;
                group.querySelectorAll('.radio-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                const input = group.querySelector('input[type="hidden"]');
                if (input) input.value = card.dataset.value;

                // Auto-advance logic for specific steps if needed
                if(group.dataset.autonext) {
                   setTimeout(nextStep, 350);
                }
            };
        });

        const nextStep = () => {
            if (currentStep < totalSteps) {
                currentStep++;
                updateUI();
            } else {
                finish();
            }
        };

        const prevStep = () => {
            if (currentStep > 1) {
                currentStep--;
                updateUI();
            }
        };

        const finish = () => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Collect radio button data not in standard FormData
            form.querySelectorAll('input[type="hidden"]').forEach(input => {
                data[input.name] = input.value;
            });

            // Collect checkboxes (pre-questions)
            const pre_questions = {};
            form.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                pre_questions[cb.name] = true;
            });
            data.pre_questions = pre_questions;

            const lead = captureLead(data);
            
            // Referral Tracking Interface
            if (window.VC && sessionStorage.getItem('referral_source_code')) {
                window.VC.registerReferral({
                    name: data.nombre,
                    condition: data.condition || 'General',
                    referral_code: sessionStorage.getItem('referral_source_code')
                });
            }

            if (onComplete) onComplete(lead);
        };

        // Attach buttons
        form.querySelectorAll('[data-next]').forEach(btn => btn.onclick = (e) =>{ e.preventDefault(); nextStep(); });
        form.querySelectorAll('[data-back]').forEach(btn => btn.onclick = (e) =>{ e.preventDefault(); prevStep(); });

        updateUI();
    };

    return {
        captureLead,
        initPreScreen
    };
})();

window.VITALIS = VITALIS;
