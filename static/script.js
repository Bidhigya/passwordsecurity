document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password-input');
    const toggleBtn = document.getElementById('toggle-visibility');
    const iconEye = toggleBtn.querySelector('.icon-eye');
    const iconEyeOff = toggleBtn.querySelector('.icon-eye-off');
    const checkBtn = document.getElementById('check-btn');
    const clearBtn = document.getElementById('clear-btn');
    const btnText = checkBtn.querySelector('.btn-text');
    const btnSpinner = checkBtn.querySelector('.spinner');
    const btnIcon = checkBtn.querySelector('.btn-icon');
    const errorBanner = document.getElementById('error-message');
    const resultsPanel = document.getElementById('results-panel');

    // Strength & Score Elements
    const strengthCard = document.getElementById('strength-card');
    const strengthBadge = document.getElementById('strength-badge');
    const strengthLabel = document.getElementById('strength-label');
    const scoreVal = document.getElementById('score-val');
    const scoreFill = document.getElementById('score-fill');
    const scoreRating = document.getElementById('score-rating');

    // Breach Elements
    const breachCard = document.getElementById('breach-card');
    const breachTitle = document.getElementById('breach-title');
    const breachDesc = document.getElementById('breach-desc');
    const breachPill = document.getElementById('breach-pill');
    const iconSafe = document.getElementById('breach-icon-safe');
    const iconWarn = document.getElementById('breach-icon-warn');
    const iconWrapper = document.getElementById('breach-icon-wrapper');

    // Criteria Elements
    const critMap = {
        length: document.getElementById('crit-length'),
        uppercase: document.getElementById('crit-uppercase'),
        lowercase: document.getElementById('crit-lowercase'),
        number: document.getElementById('crit-number'),
        special: document.getElementById('crit-special'),
        not_common: document.getElementById('crit-not-common'),
        no_repeats: document.getElementById('crit-no-repeats'),
        no_sequences: document.getElementById('crit-no-sequences'),
    };

    // Feedback List
    const feedbackList = document.getElementById('feedback-list');

    // 1. Toggle Password Visibility
    toggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        if (isPassword) {
            passwordInput.setAttribute('type', 'text');
            iconEye.classList.add('hidden');
            iconEyeOff.classList.remove('hidden');
        } else {
            passwordInput.setAttribute('type', 'password');
            iconEye.classList.remove('hidden');
            iconEyeOff.classList.add('hidden');
        }
        passwordInput.focus();
    });

    // 2. Clear Button
    clearBtn.addEventListener('click', () => {
        passwordInput.value = '';
        hideError();
        resultsPanel.classList.add('hidden');
        passwordInput.focus();
    });

    // 3. Form Submission
    document.getElementById('checker-form').addEventListener('submit', (e) => {
        e.preventDefault();
        performCheck();
    });

    // 4. Perform Check via Flask API
    async function performCheck() {
        const password = passwordInput.value;

        if (!password) {
            showError('Please enter a password to evaluate.');
            resultsPanel.classList.add('hidden');
            return;
        }

        hideError();
        setLoading(true);

        try {
            const response = await fetch('/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: password }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Server responded with status ${response.status}`);
            }

            const data = await response.json();
            renderResults(data);
        } catch (error) {
            showError(error.message || 'Failed to connect to the backend server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }

    // 5. Render Response Data into UI
    function renderResults(data) {
        resultsPanel.classList.remove('hidden');

        // Strength styling
        const strength = (data.strength || 'WEAK').toUpperCase();
        strengthBadge.textContent = strength;

        strengthCard.classList.remove('is-weak', 'is-medium', 'is-strong');
        scoreFill.classList.remove('score-weak', 'score-medium', 'score-strong');

        if (strength === 'STRONG') {
            strengthCard.classList.add('is-strong');
            strengthLabel.textContent = 'High resilience to standard attacks';
            scoreFill.classList.add('score-strong');
            scoreRating.textContent = 'Excellent complexity & entropy';
        } else if (strength === 'MEDIUM') {
            strengthCard.classList.add('is-medium');
            strengthLabel.textContent = 'Moderate security - consider improvements';
            scoreFill.classList.add('score-medium');
            scoreRating.textContent = 'Average complexity';
        } else {
            strengthCard.classList.add('is-weak');
            strengthLabel.textContent = 'Vulnerable to automated cracking';
            scoreFill.classList.add('score-weak');
            scoreRating.textContent = 'Inadequate security score';
        }

        // Score display
        const score = typeof data.score === 'number' ? data.score : 0;
        scoreVal.textContent = score;
        const fillPercent = Math.max(0, Math.min(100, (score / 5) * 100));
        scoreFill.style.width = `${fillPercent}%`;

        // Breach Database Status
        renderBreachStatus(data.breach_status, data.breach_count);

        // Update Criteria List
        if (data.criteria) {
            for (const [key, element] of Object.entries(critMap)) {
                if (element) {
                    const isPassed = Boolean(data.criteria[key]);
                    element.classList.toggle('passed', isPassed);
                    element.classList.toggle('failed', !isPassed);
                    const iconSpan = element.querySelector('.crit-icon');
                    if (iconSpan) {
                        iconSpan.textContent = isPassed ? '✓' : '✗';
                    }
                }
            }
        }

        // Suggestions / Feedback List with clean bullets
        feedbackList.innerHTML = '';
        const feedback = data.feedback || [];

        if (feedback.length === 0) {
            const li = document.createElement('li');
            li.className = 'feedback-item success';
            li.innerHTML = '<span class="bullet-dot">•</span><span class="feedback-text">Your password meets all basic security requirements and has no known breach records.</span>';
            feedbackList.appendChild(li);
        } else {
            feedback.forEach(item => {
                const li = document.createElement('li');
                const isWarning = item.includes('WARNING') || item.includes('⚠') || item.includes('commonly used') || item.includes('breaches');
                li.className = `feedback-item ${isWarning ? 'warn' : 'info'}`;
                
                // Strip emoji prefix for consistent bullet styling
                const cleanItem = item.replace(/^[⚠⚠️\s*•\-]+/, '').trim();
                li.innerHTML = `<span class="bullet-dot">•</span><span class="feedback-text">${escapeHtml(cleanItem)}</span>`;
                feedbackList.appendChild(li);
            });
        }

        // Smooth scroll to results
        resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 6. Breach Status Rendering Helper
    function renderBreachStatus(status, count) {
        breachCard.classList.remove('breach-safe', 'breach-compromised', 'breach-unavailable');
        iconWrapper.classList.remove('hidden');
        iconSafe.classList.add('hidden');
        iconWarn.classList.add('hidden');

        if (status === 'compromised' || (count && count > 0)) {
            breachCard.classList.add('breach-compromised');
            iconWrapper.classList.add('hidden');
            breachTitle.textContent = 'Compromised in Data Breaches';
            const formattedCount = Number(count).toLocaleString();
            breachDesc.innerHTML = `This password has appeared in <span class="breach-number-highlight">${formattedCount}</span> known data breaches. Do not use this password.`;
            breachPill.textContent = 'Compromised';
        } else if (status === 'unavailable' || count === null) {
            breachCard.classList.add('breach-unavailable');
            iconWarn.classList.remove('hidden');
            breachTitle.textContent = 'Breach Database Offline';
            breachDesc.textContent = 'Could not reach HaveIBeenPwned API range servers.';
            breachPill.textContent = 'Unverified';
        } else {
            breachCard.classList.add('breach-safe');
            iconSafe.classList.remove('hidden');
            breachTitle.textContent = 'No Known Breaches';
            breachDesc.textContent = 'Not found in billions of exposed records indexed by HIBP.';
            breachPill.textContent = 'Safe';
        }
    }

    // Helper: Loading UI State
    function setLoading(isLoading) {
        if (isLoading) {
            checkBtn.disabled = true;
            btnText.textContent = 'Auditing...';
            btnSpinner.classList.remove('hidden');
            btnIcon.classList.add('hidden');
        } else {
            checkBtn.disabled = false;
            btnText.textContent = 'Audit Password Security';
            btnSpinner.classList.add('hidden');
            btnIcon.classList.remove('hidden');
        }
    }

    // Helper: Error Handling
    function showError(message) {
        errorBanner.textContent = message;
        errorBanner.classList.remove('hidden');
    }

    function hideError() {
        errorBanner.textContent = '';
        errorBanner.classList.add('hidden');
    }

    // Helper: HTML Escaping
    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});