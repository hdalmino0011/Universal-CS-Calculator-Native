// ================= STATE =================
var currentBranch = "universal";
var historyEntries = [];
var lastAnswer = 0;
var keyboardEnabled = false;
var lastCalculatedSteps = '';
var lastCalculatedExpression = '';
var lastCalculatedResult = '';

// DOM Elements
var exprInput = document.getElementById('exprInput');
var resultDisplay = document.getElementById('resultDisplay');
var fallbackMessage = document.getElementById('fallbackMessage');
var branchIndicator = document.getElementById('branchIndicator');
var dynamicDiv = document.getElementById('dynamicButtons');
var calculatorView = document.getElementById('calculatorView');
var stepsView = document.getElementById('stepsView');
var fullPageView = document.getElementById('fullPageView');
var fullPageTitle = document.getElementById('fullPageTitle');
var fullPageContent = document.getElementById('fullPageContent');
var desktopSideContent = document.getElementById('desktopSideContent');
var toastEl = document.getElementById('toast');
var codeTracerView = document.getElementById('codeTracerView');
var codeTracerToggleBtn = document.getElementById('codeTracerToggleBtn');
var tracerToggleLabel = document.getElementById('tracerToggleLabel');
var drawerCodeTracerBtn = document.getElementById('drawerCodeTracerBtn');

var branchNames = {
    'universal': 'Universal (Scientific)',
    'arithmetic': 'Arithmetic & Bitwise',
    'combinatorics': 'Combinatorics',
    'logic': 'Logic & Boolean',
    'settheory': 'Set Theory',
    'numbertheory': 'Number Theory',
    'conversion': 'Number System Conversion',
    'matrix': 'Matrix Algebra',
    'complex': 'Complex Numbers'
};

// ================= TOAST =================
var toastTimer = null;
function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { toastEl.classList.remove('show'); }, 2000);
}

// ================= HAPTIC FEEDBACK =================
function buzz(ms) {
    if (navigator.vibrate) {
        try { navigator.vibrate(ms || 8); } catch (e) {}
    }
}

// ================= UTILITIES =================
function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    return s.toString().replace(/[&<>]/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m];
    });
}

function fact(n) {
    if (n < 0 || Math.floor(n) !== n) return NaN;
    if (n === 0 || n === 1) return 1;
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
}

function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = b; b = a % b; a = t; }
    return a;
}

// Extended Euclidean Algorithm: returns { gcd, s, t, steps }
function extendedGcdWithSteps(a, b) {
    var steps = [];
    var x = Math.abs(a), y = Math.abs(b);
    steps.push('<strong>Euclidean Algorithm for gcd(' + x + ', ' + y + '):</strong>');
    if (y === 0) {
        steps.push('gcd(' + x + ', 0) = ' + x);
        return { gcd: x, s: 1, t: 0, steps: steps };
    }

    var r0 = x, r1 = y;
    var s0 = 1, s1 = 0;
    var t0 = 0, t1 = 1;
    var stepIndex = 1;

    while (r1 !== 0) {
        var q = Math.floor(r0 / r1);
        var r2 = r0 % r1;
        var s2 = s0 - q * s1;
        var t2 = t0 - q * t1;
        steps.push('Step ' + stepIndex + ': ' + r0 + ' ÷ ' + r1 + ' = ' + q + ' with remainder ' + r2 + '  →  ' + r0 + ' = (' + q + ' × ' + r1 + ') + ' + r2);
        r0 = r1; r1 = r2;
        s0 = s1; s1 = s2;
        t0 = t1; t1 = t2;
        stepIndex++;
    }

    steps.push('Last non-zero remainder = <strong>' + r0 + '</strong> (Greatest Common Divisor)');
    steps.push('<strong>Bézout Identity:</strong> ' + r0 + ' = (' + s0 + ' × ' + x + ') + (' + t0 + ' × ' + y + ')');
    steps.push('Bézout integer linear coefficients: s = ' + s0 + ', t = ' + t0);
    return { gcd: r0, s: s0, t: t0, steps: steps };
}

// Repeated division for base conversion
function toBaseWithSteps(num, base) {
    var steps = [];
    var negative = num < 0;
    var n = Math.trunc(Math.abs(num));
    var baseNames = { 2: 'Binary', 8: 'Octal', 10: 'Decimal', 16: 'Hexadecimal' };
    var targetName = baseNames[base] || ('Base-' + base);

    steps.push('<strong>Converting ' + (negative ? '-' : '') + n + ' to ' + targetName + ' (Base ' + base + '):</strong>');

    if (n === 0) {
        steps.push('0 ÷ ' + base + ' = 0 with remainder 0');
        steps.push('Result: <strong>0</strong>');
        return { result: '0', steps: steps };
    }

    var digits = [];
    var stepIndex = 1;

    while (n > 0) {
        var q = Math.floor(n / base);
        var r = n % base;
        var digitChar = r.toString(base).toUpperCase();
        digits.unshift(digitChar);
        steps.push('Step ' + stepIndex + ': ' + n + ' ÷ ' + base + ' = ' + q + '  (Remainder: ' + digitChar + ')');
        n = q;
        stepIndex++;
    }

    steps.push('Read remainders from bottom to top (MSB to LSB): <strong>' + digits.join('') + '</strong>');

    var resultStr = (negative ? '-' : '') + digits.join('');
    if (negative) {
        steps.push('Include negative sign: <strong>' + resultStr + '</strong>');
    }

    if (base === 2 && !negative && num <= 255) {
        var padded8 = digits.join('').padStart(8, '0');
        steps.push('8-bit binary representation: <code>' + padded8.slice(0, 4) + ' ' + padded8.slice(4) + '</code>');
    }

    return { result: resultStr, steps: steps };
}

// Place-value expansion for converting back to decimal
function fromBaseWithSteps(str, base) {
    var steps = [];
    var clean = str.toUpperCase().trim();
    var negative = clean.charAt(0) === '-';
    if (negative) clean = clean.substring(1);
    clean = clean.replace(/^0+(?=.)/, '');
    var baseNames = { 2: 'Binary', 8: 'Octal', 16: 'Hexadecimal' };
    var sourceName = baseNames[base] || ('Base-' + base);

    steps.push('<strong>Converting ' + (negative ? '-' : '') + clean + ' from ' + sourceName + ' (Base ' + base + ') to Decimal:</strong>');

    var chars = clean.split('');
    var n = chars.length;
    var total = 0;
    var parts = [];

    for (var i = 0; i < n; i++) {
        var digit = parseInt(chars[i], base);
        if (isNaN(digit)) {
            steps.push('Invalid digit "' + chars[i] + '" for base ' + base);
            return { result: NaN, steps: steps };
        }
        var power = n - 1 - i;
        var val = digit * Math.pow(base, power);
        steps.push('Digit "' + chars[i] + '" (weight ' + base + '<sup>' + power + '</sup> = ' + Math.pow(base, power) + '): ' + digit + ' × ' + Math.pow(base, power) + ' = ' + val);
        parts.push(val);
        total += val;
    }

    steps.push('Sum of all positional values: ' + parts.join(' + ') + ' = <strong>' + total + '</strong>');

    if (negative) {
        total = -total;
        steps.push('Applying negative sign: <strong>' + total + '</strong>');
    }

    return { result: total, steps: steps };
}

// ================= SYMBOL PRE-PROCESSOR =================
function preprocessExpression(expr) {
    var processed = expr;
    processed = processed.replace(/&&/g, ' AND ');
    processed = processed.replace(/\|\|/g, ' OR ');
    processed = processed.replace(/(?<![\d)])!(?!=)/g, ' NOT ');
    processed = processed.replace(/÷/g, '/');
    processed = processed.replace(/×/g, '*');
    processed = processed.replace(/≥/g, '>=');
    processed = processed.replace(/≤/g, '<=');
    processed = processed.replace(/≠/g, '!=');
    processed = processed.replace(/∧/g, ' AND ');
    processed = processed.replace(/∨/g, ' OR ');
    processed = processed.replace(/¬/g, ' NOT ');
    processed = processed.replace(/⊕/g, ' XOR ');
    processed = processed.replace(/→/g, ' IMPLIES ');
    processed = processed.replace(/↔/g, ' EQUIV ');
    processed = processed.replace(/π/g, '(' + Math.PI + ')');
    processed = processed.replace(/(?<![a-zA-Z])e(?![a-zA-Z(])/g, '(' + Math.E + ')');
    processed = processed.replace(/ANS/gi, '(' + lastAnswer + ')');
    processed = processed.replace(/([^\s<>!=])=([^=])/g, '$1==$2');
    return processed;
}

// ================= CARET-AWARE INPUT =================
function insertAtCaret(text) {
    var el = exprInput;
    var start = el.selectionStart != null ? el.selectionStart : el.value.length;
    var end = el.selectionEnd != null ? el.selectionEnd : el.value.length;
    var before = el.value.substring(0, start);
    var after = el.value.substring(end);
    el.value = before + text + after;
    var newPos = start + text.length;
    el.focus();
    el.setSelectionRange(newPos, newPos);
}

function moveCaret(delta) {
    var el = exprInput;
    var pos = (el.selectionStart != null ? el.selectionStart : el.value.length) + delta;
    pos = Math.max(0, Math.min(el.value.length, pos));
    el.focus();
    el.setSelectionRange(pos, pos);
}

function backspaceAtCaret() {
    var el = exprInput;
    var start = el.selectionStart != null ? el.selectionStart : el.value.length;
    var end = el.selectionEnd != null ? el.selectionEnd : el.value.length;
    if (start === end) {
        if (start === 0) return;
        el.value = el.value.substring(0, start - 1) + el.value.substring(end);
        el.focus();
        el.setSelectionRange(start - 1, start - 1);
    } else {
        el.value = el.value.substring(0, start) + el.value.substring(end);
        el.focus();
        el.setSelectionRange(start, start);
    }
}

// ================= VIEW SWITCHING & SIDE PANEL =================
function showCalculatorView() {
    calculatorView.style.display = 'flex';
    stepsView.style.display = 'none';
    fullPageView.style.display = 'none';
    if (codeTracerView) codeTracerView.style.display = 'none';
    var appCont = document.getElementById('appContainer');
    if (appCont) appCont.classList.remove('tracer-active-mode');
    updateTracerToggleBtnState(false);
    updateDrawerActiveState(currentBranch);
}

function showCodeTracerView() {
    calculatorView.style.display = 'none';
    stepsView.style.display = 'none';
    fullPageView.style.display = 'none';
    if (codeTracerView) codeTracerView.style.display = 'flex';
    var appCont = document.getElementById('appContainer');
    if (appCont) appCont.classList.add('tracer-active-mode');
    updateTracerToggleBtnState(true);
    updateDrawerActiveState('tracer');
    if (window.initCodeTracer) {
        window.initCodeTracer();
    }
    if (window.updateTracerLineNumbers) {
        window.updateTracerLineNumbers();
    }
}

function toggleCodeTracerView() {
    if (codeTracerView && codeTracerView.style.display === 'flex') {
        showCalculatorView();
    } else {
        showCodeTracerView();
    }
}

function updateDrawerActiveState(activeBranch) {
    var allDrawerBtns = document.querySelectorAll('.branch-drawer-btn');
    for (var i = 0; i < allDrawerBtns.length; i++) {
        if (allDrawerBtns[i].getAttribute('data-branch') === activeBranch) {
            allDrawerBtns[i].classList.add('active');
        } else {
            allDrawerBtns[i].classList.remove('active');
        }
    }
}

function updateTracerToggleBtnState(isTracer) {
    var appTitle = document.getElementById('appTitle');
    var branchIndicatorEl = document.getElementById('branchIndicator');
    var tracerBtn = document.getElementById('codeTracerToggleBtn');
    if (isTracer) {
        if (tracerToggleLabel) tracerToggleLabel.textContent = 'CALCULATOR';
        if (tracerBtn) tracerBtn.classList.add('active-tracer-mode');
        if (appTitle) appTitle.textContent = 'CODE TRACER & DSA';
        if (branchIndicatorEl) branchIndicatorEl.textContent = 'Universal Code & DSA Tracing Engine';
    } else {
        if (tracerToggleLabel) tracerToggleLabel.textContent = 'DSA TRACER';
        if (tracerBtn) tracerBtn.classList.remove('active-tracer-mode');
        if (appTitle) appTitle.textContent = 'UNIVERSAL CS CALCULATOR';
        if (branchIndicatorEl) branchIndicatorEl.textContent = branchNames[currentBranch] || 'Universal';
    }
}

function formatStepsHtml(steps) {
    if (!steps || !steps.trim()) {
        return '<div class="step-item">No detailed steps available for this calculation.</div>';
    }
    var stepLines = steps.split('\n');
    var html = '';
    var num = 0;
    for (var i = 0; i < stepLines.length; i++) {
        var line = stepLines[i].trim();
        if (line) {
            num++;
            var isRuleHeader = line.indexOf('<strong>') === 0 || line.indexOf('===') !== -1 || line.indexOf('Rule:') !== -1;
            var isHighlight = line.indexOf('Final result') !== -1 || line.indexOf('Result:') !== -1;
            var classes = 'step-item';
            if (isRuleHeader) classes += ' rule-header';
            if (isHighlight) classes += ' highlight-step';

            html += '<div class="' + classes + '"><span class="step-number">' + num + '.</span><span class="step-text">' + line + '</span></div>';
        }
    }
    return html;
}

function updateDesktopSidePanel(expression, result, steps) {
    if (!desktopSideContent) return;
    if (!expression && !result) {
        desktopSideContent.innerHTML = '<div class="side-empty-state">' +
            '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>' +
            '<p>Perform an evaluation to inspect the <strong>detailed mathematical proof</strong> and step-by-step evaluation.</p>' +
            '</div>';
        return;
    }

    var html = '<div class="steps-expression"><strong>Expression:</strong> ' + escapeHtml(expression) + '</div>' +
               '<div class="steps-result-full"><span class="result-label">RESULT:</span> <span class="result-value">' + escapeHtml(result) + '</span></div>' +
               '<div class="steps-list-full">' + formatStepsHtml(steps) + '</div>';
    desktopSideContent.innerHTML = html;
}

function openStepsView() {
    if (!lastCalculatedExpression && !exprInput.value.trim()) {
        showToast('Enter an expression and tap = to view steps');
        return;
    }
    if (!lastCalculatedExpression && exprInput.value.trim()) {
        evaluate();
    }
    calculatorView.style.display = 'none';
    stepsView.style.display = 'flex';
    fullPageView.style.display = 'none';
}

function showStepsView(expression, result, steps, navigate) {
    lastCalculatedExpression = expression;
    lastCalculatedResult = result;
    lastCalculatedSteps = steps;

    var stepsExpr = document.getElementById('stepsExpression');
    if (stepsExpr) stepsExpr.innerHTML = '<strong>Expression:</strong> ' + escapeHtml(expression);
    var stepsRes = document.getElementById('stepsResultFull');
    if (stepsRes) stepsRes.innerHTML = '<span class="result-label">RESULT:</span> <span class="result-value">' + escapeHtml(result) + '</span>';
    var stepsList = document.getElementById('stepsListFull');
    if (stepsList) {
        stepsList.innerHTML = formatStepsHtml(steps);
    }

    updateDesktopSidePanel(expression, result, steps);

    if (navigate || stepsView.style.display === 'flex') {
        calculatorView.style.display = 'none';
        stepsView.style.display = 'flex';
        fullPageView.style.display = 'none';
    }
}

function showFullPage(title, contentHtml) {
    fullPageTitle.textContent = title;
    fullPageContent.innerHTML = contentHtml;
    calculatorView.style.display = 'none';
    stepsView.style.display = 'none';
    fullPageView.style.display = 'flex';
}

function copyStepsToClipboard() {
    if (!lastCalculatedSteps && !lastCalculatedExpression) {
        showToast('No steps to copy');
        return;
    }
    var fullText = 'EXPRESSION: ' + lastCalculatedExpression + '\n' +
                   'RESULT: ' + lastCalculatedResult + '\n\n' +
                   'STEP-BY-STEP EVALUATION:\n' +
                   lastCalculatedSteps.replace(/<[^>]*>/g, '');

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullText).then(function() {
            showToast('Steps copied to clipboard!');
        }).catch(function() {
            showToast('Unable to copy to clipboard');
        });
    } else {
        showToast('Clipboard access not supported');
    }
}

// ================= HISTORY =================
function loadHistory() {
    try {
        var stored = localStorage.getItem('csCalcHistory');
        historyEntries = stored ? JSON.parse(stored) : [];
    } catch (e) { historyEntries = []; }
}

function saveHistory() {
    try { localStorage.setItem('csCalcHistory', JSON.stringify(historyEntries.slice(0, 50))); }
    catch (e) { console.warn('Could not save history'); }
}

function addHistory(expr, result, steps, branch) {
    historyEntries.unshift({
        expr: expr, result: result, steps: (steps || '').substring(0, 1000),
        branch: branch, date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    if (historyEntries.length > 50) historyEntries.length = 50;
    saveHistory();
}

function clearHistory() { historyEntries = []; saveHistory(); }

// ================= THEMES =================
var themes = ['default', 'obsidian', 'royalblue', 'orange', 'highcontrast', 'forest', 'crimson', 'slate', 'purple', 'midnight', 'sand', 'cyan-night'];
var themeNames = ['Default Modern', 'Obsidian Violet', 'Royal Blue', 'Deep Amber', 'High Contrast', 'Emerald Forest', 'Crimson Rose', 'Slate Steel', 'Electric Purple', 'Midnight Indigo', 'Warm Sand', 'Cyan Neon'];

function applyTheme(theme) {
    document.body.className = '';
    document.body.classList.add('theme-' + theme);
    localStorage.setItem('activeTheme', theme);
}

function initTheme() {
    var saved = localStorage.getItem('activeTheme');
    if (saved && themes.indexOf(saved) !== -1) applyTheme(saved);
    else applyTheme('default');
}

// ================= FONTS =================
function initFont() {
    var saved = localStorage.getItem('appFont');
    document.body.style.fontFamily = saved || "'Inter', 'Segoe UI', system-ui, sans-serif";
}

function setFont(font) {
    document.body.style.fontFamily = font;
    localStorage.setItem('appFont', font);
}

// ================= KEYBOARD TOGGLE =================
function applyKeyboardState() {
    if (keyboardEnabled) {
        exprInput.removeAttribute('readonly');
        exprInput.inputMode = 'text';
        document.getElementById('keyboardToggleBtn').classList.add('active');
    } else {
        exprInput.setAttribute('readonly', 'readonly');
        exprInput.inputMode = 'none';
        document.getElementById('keyboardToggleBtn').classList.remove('active');
        if (document.activeElement === exprInput) {
            exprInput.blur();
        }
    }
}

function toggleKeyboard() {
    keyboardEnabled = !keyboardEnabled;
    localStorage.setItem('keyboardEnabled', keyboardEnabled ? 'true' : 'false');
    applyKeyboardState();
    showToast(keyboardEnabled ? 'Hardware keyboard enabled' : 'Virtual keypad mode');
}

function initKeyboardState() {
    var saved = localStorage.getItem('keyboardEnabled');
    keyboardEnabled = (saved === 'true');
    applyKeyboardState();
}

// ================= PWA WELCOME MODAL =================
function showPwaWelcomeModal() {
    var modal = document.getElementById('pwaWelcomeModal');
    if (modal) modal.style.display = 'flex';
}

function hidePwaWelcomeModal() {
    var modal = document.getElementById('pwaWelcomeModal');
    if (modal) modal.style.display = 'none';
}

function handlePwaWelcomeResponse() {
    localStorage.setItem('pwaWelcomeSeen', 'true');
    hidePwaWelcomeModal();
}

function initPwaWelcomeModal() {
    var seen = localStorage.getItem('pwaWelcomeSeen');
    if (!seen) {
        showPwaWelcomeModal();
    }
    var agreeBtn = document.getElementById('pwaAgreeBtn');
    var disagreeBtn = document.getElementById('pwaDisagreeBtn');
    if (agreeBtn) agreeBtn.addEventListener('click', handlePwaWelcomeResponse);
    if (disagreeBtn) disagreeBtn.addEventListener('click', handlePwaWelcomeResponse);
}

// ================= BUTTON DEFINITIONS =================
var universalButtons = [
    '(', ')', 'π', 'e',
    '7', '8', '9', '÷',
    '4', '5', '6', '×',
    '1', '2', '3', '-',
    '0', '.', '%', '+',
    '√', '^', '!', '==',
    'sin', 'cos', 'tan', 'abs',
    'log', 'ln', 'AND', 'OR',
    'NOT', 'XOR', '≥', '≤',
    '≠', '<', '>'
];

var arithmeticButtons = [
    '(', ')', '%', '÷',
    '7', '8', '9', '×',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '0', '.', '^', '√',
    '!', 'abs', '&', '|',
    '~', '<<', '>>', 'XOR',
    '≥', '≤', '≠', '=='
];

var combinatoricsButtons = [
    '7', '8', '9', 'nCr(',
    '4', '5', '6', 'nPr(',
    '1', '2', '3', '!',
    '0', '.', '(', ')',
    ','
];

var logicButtons = [
    'TRUE', 'FALSE', '(', ')',
    '7', '8', '9', 'AND',
    '4', '5', '6', 'OR',
    '1', '2', '3', 'NOT',
    '0', '.', 'XOR', 'IMPLIES',
    'EQUIV', '==', '!=', '≥',
    '≤', '>', '<'
];

var settheoryButtons = [
    'UNION', '∩', 'COMPLEMENT', '\\',
    'SUBSET', 'POWERSET', '{', '}',
    '7', '8', '9', ',',
    '4', '5', '6', '∅',
    '1', '2', '3', 'A',
    '0', 'B', 'U', 'C'
];

var numbertheoryButtons = [
    'gcd(', 'lcm(', 'mod(', 'prime?(',
    'factor(', '(', ')', ',',
    '7', '8', '9', 'phi(',
    '4', '5', '6', 'modpow(',
    '1', '2', '3', '^',
    '0', '.'
];

var conversionButtons = [
    'DEC → BINARY', 'BIN → DECIMAL',
    'DEC → HEX', 'HEX → DECIMAL',
    'DEC → OCT', 'OCT → DECIMAL',
    'BIN → HEX', 'HEX → BINARY',
    '7', '8', '9', 'A',
    '4', '5', '6', 'B',
    '1', '2', '3', 'C',
    '0', 'D', 'E', 'F'
];

var matrixButtons = [
    'det2x2(', 'inv2x2(', 'trans2x2(', 'trace2x2(',
    'add2x2(', 'mul2x2(', '(', ')',
    '7', '8', '9', ',',
    '4', '5', '6', '-',
    '1', '2', '3', '.',
    '0', '[', ']', '+'
];

var complexButtons = [
    're(', 'im(', 'conj(', 'arg(',
    'abs(', 'polar(', '(', ')',
    '7', '8', '9', 'i',
    '4', '5', '6', '+',
    '1', '2', '3', '-',
    '0', '.', '*', '/'
];

function getFullButtons(branch) {
    switch (branch) {
        case 'universal': return universalButtons;
        case 'arithmetic': return arithmeticButtons;
        case 'combinatorics': return combinatoricsButtons;
        case 'logic': return logicButtons;
        case 'settheory': return settheoryButtons;
        case 'numbertheory': return numbertheoryButtons;
        case 'conversion': return conversionButtons;
        case 'matrix': return matrixButtons;
        case 'complex': return complexButtons;
        default: return universalButtons;
    }
}

function isNumberButton(label) { return /^[0-9A-F.]$/.test(label); }
function isEqualsButton(label) { return label === '=='; }

function renderButtons() {
    var btns = getFullButtons(currentBranch);
    if (!dynamicDiv) return;
    dynamicDiv.innerHTML = '';

    for (var i = 0; i < btns.length; i++) {
        var label = btns[i];
        var btn = document.createElement('button');

        if (isNumberButton(label)) btn.className = 'calc-btn number-btn';
        else if (isEqualsButton(label)) btn.className = 'calc-btn equals-btn';
        else btn.className = 'calc-btn operator-btn';

        if (label.length > 5) btn.classList.add('compact-label');

        btn.textContent = label;
        btn.type = 'button';

        (function(btnLabel) {
            btn.onclick = function() {
                buzz();
                if (currentBranch === 'conversion' && btnLabel.indexOf('→') !== -1) {
                    exprInput.value = btnLabel + ' ';
                    exprInput.focus();
                    exprInput.setSelectionRange(exprInput.value.length, exprInput.value.length);
                } else {
                    insertAtCaret(btnLabel);
                }
            };
        })(label);

        dynamicDiv.appendChild(btn);
    }
}

function switchBranch(branch) {
    if (branch === 'tracer') {
        buzz();
        showCodeTracerView();
        return;
    }

    currentBranch = branch;
    updateBranchIndicator();
    renderButtons();

    // Update drawer buttons
    updateDrawerActiveState(branch);

    // Update desktop tabs
    var allTabs = document.querySelectorAll('.mode-tab-btn');
    for (var j = 0; j < allTabs.length; j++) {
        if (allTabs[j].getAttribute('data-branch') === branch) {
            allTabs[j].classList.add('active');
        } else {
            allTabs[j].classList.remove('active');
        }
    }

    if (fallbackMessage) fallbackMessage.style.display = 'none';
    showCalculatorView();
}

function updateBranchIndicator() {
    if (branchIndicator) branchIndicator.textContent = branchNames[currentBranch] || 'Universal (Scientific)';
}

// ================= EXPRESSION COMPILER =================
function wrapBareFunctionArgs(expr, fnNames) {
    var out = expr;
    for (var i = 0; i < fnNames.length; i++) {
        var fn = fnNames[i];
        var re = new RegExp('\\b' + fn + '\\s*(-?\\d+(?:\\.\\d+)?)', 'g');
        out = out.replace(re, function(_, num) { return fn + '(' + num + ')'; });
    }
    return out;
}

function compileToJS(expr) {
    var clean = preprocessExpression(expr);

    var processed = clean.replace(/(\d)\s*%\s*(?=\d)/g, '$1__MOD__');
    processed = processed.replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)');
    processed = processed.replace(/__MOD__/g, ' % ');

    processed = processed.replace(/√/g, 'sqrt');
    processed = processed.replace(/\^/g, '**');

    processed = processed.replace(/(\d+(?:\.\d+)?|\([^()]*\))!(?!=)/g, function(_, g) { return 'fact(' + g + ')'; });

    processed = wrapBareFunctionArgs(processed, ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs']);

    processed = processed.replace(/\bAND\b/gi, '&&').replace(/\bOR\b/gi, '||').replace(/\bNOT\b/gi, '!');
    processed = processed.replace(/\bXOR\b/gi, ' XORFN ');
    processed = processed.replace(/\bIMPLIES\b/gi, ' IMPLIESFN ');
    processed = processed.replace(/\bEQUIV\b/gi, ' EQUIVFN ');
    processed = processed.replace(/\bTRUE\b/gi, 'true').replace(/\bFALSE\b/gi, 'false');

    processed = processed.replace(/==/g, '===').replace(/!==?=/g, '!==');
    processed = processed.replace(/!==(?!=)/g, '!==');

    processed = processed.replace(/\bsin\(/g, 'Math.sin(');
    processed = processed.replace(/\bcos\(/g, 'Math.cos(');
    processed = processed.replace(/\btan\(/g, 'Math.tan(');
    processed = processed.replace(/\blog\(/g, 'Math.log10(');
    processed = processed.replace(/\bln\(/g, 'Math.log(');
    processed = processed.replace(/\bsqrt\(/g, 'Math.sqrt(');
    processed = processed.replace(/\babs\(/g, 'Math.abs(');

    processed = processed.replace(/(.+?)\s*XORFN\s*(.+)/, 'xorFn($1,$2)');
    processed = processed.replace(/(.+?)\s*IMPLIESFN\s*(.+)/, 'impliesFn($1,$2)');
    processed = processed.replace(/(.+?)\s*EQUIVFN\s*(.+)/, 'equivFn($1,$2)');

    return processed;
}

function xorFn(a, b) { return (!!a) !== (!!b); }
function impliesFn(a, b) { return (!a) || (!!b); }
function equivFn(a, b) { return (!!a) === (!!b); }

function runCompiled(processed) {
    var fn = new Function('fact', 'xorFn', 'impliesFn', 'equivFn', 'return (' + processed + ')');
    return fn(fact, xorFn, impliesFn, equivFn);
}

// ================= STEP GENERATOR FOR ARITHMETIC & BITWISE =================
function generateSteps(expr) {
    var steps = [];
    steps.push('<strong>Input Expression:</strong> ' + expr);

    var clean = preprocessExpression(expr);
    if (clean !== expr) steps.push('Standardized Notation: <code>' + clean + '</code>');

    // Bitwise NOT: ~n or NOT n
    var notMatch = clean.match(/^(?:~|NOT\s+)(-?\d+)$/i);
    if (notMatch) {
        var nVal = parseInt(notMatch[1], 10);
        var notRes = ~nVal;
        steps.push('<strong>Bitwise NOT Analysis (~' + nVal + '):</strong>');
        var binOrig = (nVal >>> 0).toString(2).padStart(8, '0').slice(-8);
        var binNot = (notRes >>> 0).toString(2).padStart(8, '0').slice(-8);
        steps.push('Step 1 (Binary Representation): ' + nVal + ' = <code>' + binOrig + '</code> (8-bit)');
        steps.push('Step 2 (Bit Inversion 0 ↔ 1): Invert each bit of <code>' + binOrig + '</code> → <code>' + binNot + '</code>');
        steps.push('Step 3 (Two’s Complement Arithmetic): ~n = -(n + 1) = -(' + nVal + ' + 1) = <strong>' + notRes + '</strong>');
        return steps.join('\n');
    }

    // Bitwise Binary: a & b, a | b, a ^ b, a XOR b, a << b, a >> b
    var bitwiseMatch = clean.match(/(-?\d+)\s*(&|\||\^|XOR|<<|>>)\s*(-?\d+)/i);
    if (bitwiseMatch && !clean.includes('+') && !clean.includes('*') && !clean.includes('/')) {
        var op1 = parseInt(bitwiseMatch[1], 10);
        var op = bitwiseMatch[2].toUpperCase();
        var op2 = parseInt(bitwiseMatch[3], 10);
        var bRes;
        var opName = '';
        if (op === '&') { bRes = op1 & op2; opName = 'Bitwise AND (&)'; }
        else if (op === '|') { bRes = op1 | op2; opName = 'Bitwise OR (|)'; }
        else if (op === '^' || op === 'XOR') { bRes = op1 ^ op2; opName = 'Bitwise XOR (⊕)'; }
        else if (op === '<<') { bRes = op1 << op2; opName = 'Bitwise Left Shift (<<)'; }
        else if (op === '>>') { bRes = op1 >> op2; opName = 'Bitwise Right Shift (>>)'; }

        steps.push('<strong>' + opName + ' Operation:</strong> ' + op1 + ' ' + op + ' ' + op2);
        var bin1 = (op1 >>> 0).toString(2).padStart(8, '0').slice(-8);
        var bin2 = (op2 >>> 0).toString(2).padStart(8, '0').slice(-8);
        var binRes = (bRes >>> 0).toString(2).padStart(8, '0').slice(-8);

        steps.push('Operand 1 (Binary): <code>' + bin1.slice(0, 4) + ' ' + bin1.slice(4) + '</code> (' + op1 + ')');
        steps.push('Operand 2 (Binary): <code>' + bin2.slice(0, 4) + ' ' + bin2.slice(4) + '</code> (' + op2 + ')');

        if (op === '&') {
            steps.push('Bitwise AND Rule: Output bit is 1 only when BOTH input bits are 1.');
            for (var b = 7; b >= 0; b--) {
                var bitA = (op1 >> b) & 1, bitB = (op2 >> b) & 1, bitR = (bRes >> b) & 1;
                steps.push('Bit ' + b + ': ' + bitA + ' AND ' + bitB + ' = ' + bitR);
            }
        } else if (op === '|') {
            steps.push('Bitwise OR Rule: Output bit is 1 when AT LEAST ONE input bit is 1.');
            for (var b2 = 7; b2 >= 0; b2--) {
                var bitA2 = (op1 >> b2) & 1, bitB2 = (op2 >> b2) & 1, bitR2 = (bRes >> b2) & 1;
                steps.push('Bit ' + b2 + ': ' + bitA2 + ' OR ' + bitB2 + ' = ' + bitR2);
            }
        } else if (op === '^' || op === 'XOR') {
            steps.push('Bitwise XOR Rule: Output bit is 1 when input bits DIFFER (1 ⊕ 0 = 1, 0 ⊕ 1 = 1; identical bits = 0).');
            for (var b3 = 7; b3 >= 0; b3--) {
                var bitA3 = (op1 >> b3) & 1, bitB3 = (op2 >> b3) & 1, bitR3 = (bRes >> b3) & 1;
                steps.push('Bit ' + b3 + ': ' + bitA3 + ' XOR ' + bitB3 + ' = ' + bitR3);
            }
        } else if (op === '<<') {
            steps.push('Left Shift Rule: Shift bits of ' + op1 + ' left by ' + op2 + ' positions (multiplies by 2<sup>' + op2 + '</sup> = ' + Math.pow(2, op2) + ').');
            steps.push('Calculation: ' + op1 + ' × ' + Math.pow(2, op2) + ' = <strong>' + bRes + '</strong>');
        } else if (op === '>>') {
            steps.push('Right Shift Rule: Shift bits of ' + op1 + ' right by ' + op2 + ' positions (arithmetic floor division by 2<sup>' + op2 + '</sup> = ' + Math.pow(2, op2) + ').');
            steps.push('Calculation: ⌊' + op1 + ' ÷ ' + Math.pow(2, op2) + '⌋ = <strong>' + bRes + '</strong>');
        }

        steps.push('Result (Binary): <code>' + binRes.slice(0, 4) + ' ' + binRes.slice(4) + '</code>');
        steps.push('Result (Decimal): <strong>' + bRes + '</strong>');
        return steps.join('\n');
    }

    var working = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').trim();

    // 1. Factorials: e.g. 5! or fact(5)
    var factRegex = /(\d+)!/;
    var guard = 0;
    while (factRegex.test(working) && guard < 10) {
        guard++;
        working = working.replace(factRegex, function(_, nStr) {
            var n = parseInt(nStr, 10);
            if (n > 20) return 'Infinity';
            var f = 1;
            var seq = [];
            for (var i = n; i >= 1; i--) { f *= i; seq.push(i); }
            var expansion = seq.length ? seq.join(' × ') : '1';
            steps.push('Order of Operations (Factorial): Calculate ' + n + '! = ' + expansion + ' = <strong>' + f + '</strong>');
            return f;
        });
        steps.push('→ Expression is now: <code>' + working + '</code>');
    }

    // 2. Square roots: e.g. sqrt(144) or √(144)
    var sqrtRegex = /(?:sqrt|√)\s*\(?\s*(-?\d+(?:\.\d+)?)\s*\)?/;
    guard = 0;
    while (sqrtRegex.test(working) && guard < 10) {
        guard++;
        working = working.replace(sqrtRegex, function(_, num) {
            var n = parseFloat(num);
            var res = Math.sqrt(n);
            if (isNaN(res)) res = 'NaN';
            else if (!Number.isInteger(res)) res = parseFloat(res.toFixed(6));
            steps.push('Function (Square Root): √(' + num + ') = <strong>' + res + '</strong>');
            return res;
        });
        steps.push('→ Expression is now: <code>' + working + '</code>');
    }

    // 3. Absolute value: abs(x)
    var absRegex = /abs\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/i;
    guard = 0;
    while (absRegex.test(working) && guard < 10) {
        guard++;
        working = working.replace(absRegex, function(_, num) {
            var val = Math.abs(parseFloat(num));
            steps.push('Function (Absolute Value): |' + num + '| = <strong>' + val + '</strong>');
            return val;
        });
        steps.push('→ Expression is now: <code>' + working + '</code>');
    }

    // 4. Logarithms: log(x), ln(x)
    var logRegex = /\b(log|ln)\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/i;
    guard = 0;
    while (logRegex.test(working) && guard < 10) {
        guard++;
        working = working.replace(logRegex, function(_, fnName, num) {
            var n = parseFloat(num);
            var val = fnName.toLowerCase() === 'log' ? Math.log10(n) : Math.log(n);
            if (!Number.isInteger(val)) val = parseFloat(val.toFixed(6));
            var label = fnName.toLowerCase() === 'log' ? 'Common Logarithm log₁₀(' + num + ')' : 'Natural Logarithm ln(' + num + ')';
            steps.push('Function (' + label + ') = <strong>' + val + '</strong>');
            return val;
        });
        steps.push('→ Expression is now: <code>' + working + '</code>');
    }

    // 5. Trigonometric functions: sin(x), cos(x), tan(x)
    var trigRegex = /\b(sin|cos|tan)\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/i;
    guard = 0;
    while (trigRegex.test(working) && guard < 10) {
        guard++;
        working = working.replace(trigRegex, function(_, fnName, num) {
            var rad = parseFloat(num);
            var val;
            if (fnName.toLowerCase() === 'sin') val = Math.sin(rad);
            else if (fnName.toLowerCase() === 'cos') val = Math.cos(rad);
            else val = Math.tan(rad);
            if (!Number.isInteger(val)) val = parseFloat(val.toFixed(6));
            steps.push('Function (' + fnName.toUpperCase() + ' in radians): ' + fnName + '(' + num + ' rad) = <strong>' + val + '</strong>');
            return val;
        });
        steps.push('→ Expression is now: <code>' + working + '</code>');
    }

    // 6. Parentheses resolution (PEMDAS - P: innermost groups)
    guard = 0;
    var parenRegex = /\(([^()]+)\)/;
    while (parenRegex.test(working) && guard < 15) {
        guard++;
        var pm = parenRegex.exec(working);
        var subExpr = pm[1];
        var subVal;
        try {
            var subClean = subExpr.replace(/\^/g, '**');
            subVal = Function('return (' + subClean + ')')();
            if (typeof subVal === 'number' && !Number.isInteger(subVal)) subVal = parseFloat(subVal.toFixed(6));
            steps.push('Order of Operations (Parentheses): Evaluate innermost group (' + subExpr + ') = <strong>' + subVal + '</strong>');
            working = working.slice(0, pm.index) + subVal + working.slice(pm.index + pm[0].length);
            steps.push('→ Expression is now: <code>' + working + '</code>');
        } catch(e) {
            break;
        }
    }

    // 7. Powers / Exponents (PEMDAS - E: ^ or **)
    guard = 0;
    var powRegex = /(-?\d+(?:\.\d+)?)\s*(?:\^|\*\*)\s*(-?\d+(?:\.\d+)?)/;
    while (powRegex.test(working) && guard < 15) {
        guard++;
        working = working.replace(powRegex, function(_, a, b) {
            var base = parseFloat(a), exp = parseFloat(b);
            var val = Math.pow(base, exp);
            if (typeof val === 'number' && !Number.isInteger(val)) val = parseFloat(val.toFixed(6));
            steps.push('Order of Operations (Exponents): ' + a + '<sup>' + b + '</sup> = <strong>' + val + '</strong>');
            return val;
        });
        steps.push('→ Expression is now: <code>' + working + '</code>');
    }

    // 8. Multiplications, Divisions, Modulos (PEMDAS - MD, evaluated strictly left to right)
    guard = 0;
    var mulDivModRegex = /(-?\d+(?:\.\d+)?)\s*([*\/%])\s*(-?\d+(?:\.\d+)?)/;
    while (mulDivModRegex.test(working) && guard < 20) {
        guard++;
        var matched = false;
        working = working.replace(mulDivModRegex, function(_, a, op, b) {
            matched = true;
            var numA = parseFloat(a), numB = parseFloat(b), val;
            var sym = op === '*' ? '×' : (op === '/' ? '÷' : '%');
            if (op === '*') val = numA * numB;
            else if (op === '/') val = numB === 0 ? 'Infinity' : (numA / numB);
            else val = numA % numB;
            if (typeof val === 'number' && !Number.isInteger(val)) val = parseFloat(val.toFixed(6));
            steps.push('Order of Operations (Multiply/Divide left-to-right): ' + a + ' ' + sym + ' ' + b + ' = <strong>' + val + '</strong>');
            return val;
        });
        if (!matched) break;
        steps.push('→ Expression is now: <code>' + working + '</code>');
    }

    // 9. Additions and Subtractions (PEMDAS - AS, evaluated strictly left to right)
    guard = 0;
    var addSubRegex = /(-?\d+(?:\.\d+)?)\s*([+\-])\s*(\d+(?:\.\d+)?)/;
    while (addSubRegex.test(working) && guard < 20) {
        guard++;
        var matched2 = false;
        working = working.replace(addSubRegex, function(match, a, op, b, offset) {
            if (offset === 0 && op === '-' && a === '') return match;
            matched2 = true;
            var numA = parseFloat(a), numB = parseFloat(b), val;
            if (op === '+') val = numA + numB;
            else val = numA - numB;
            if (typeof val === 'number' && !Number.isInteger(val)) val = parseFloat(val.toFixed(6));
            steps.push('Order of Operations (Add/Subtract left-to-right): ' + a + ' ' + op + ' ' + b + ' = <strong>' + val + '</strong>');
            return val;
        });
        if (!matched2) break;
        steps.push('→ Expression is now: <code>' + working + '</code>');
    }

    // 10. Comparisons: ==, !=, ≠, <, >, <=, ≤, >=, ≥
    var compRegex = /(-?\d+(?:\.\d+)?)\s*(===?|!==?|≠|<=|≤|>=|≥|<|>)\s*(-?\d+(?:\.\d+)?)/;
    var compMatch = working.match(compRegex);
    if (compMatch) {
        var ca = parseFloat(compMatch[1]), cop = compMatch[2], cb = parseFloat(compMatch[3]);
        var cRes;
        var cOpLabel = cop;
        if (cop === '==' || cop === '===') { cRes = ca === cb; cOpLabel = '== (Equal to)'; }
        else if (cop === '!=' || cop === '!==' || cop === '≠') { cRes = ca !== cb; cOpLabel = '≠ (Not equal to)'; }
        else if (cop === '<') { cRes = ca < cb; cOpLabel = '< (Less than)'; }
        else if (cop === '>') { cRes = ca > cb; cOpLabel = '> (Greater than)'; }
        else if (cop === '<=' || cop === '≤') { cRes = ca <= cb; cOpLabel = '≤ (Less than or equal to)'; }
        else if (cop === '>=' || cop === '≥') { cRes = ca >= cb; cOpLabel = '≥ (Greater than or equal to)'; }

        steps.push('Comparison Evaluation: ' + ca + ' ' + cOpLabel + ' ' + cb);
        steps.push('Condition Truth Value: <strong>' + (cRes ? 'TRUE (1)' : 'FALSE (0)') + '</strong>');
        return steps.join('\n');
    }

    // Fallback compilation
    var processed = compileToJS(expr);
    try {
        var finalVal = runCompiled(processed);
        if (typeof finalVal === 'number' && !Number.isInteger(finalVal)) finalVal = parseFloat(finalVal.toFixed(6));
        steps.push('<strong>Final Evaluated Result:</strong> ' + finalVal);
    } catch (e) {
        steps.push('<strong>Final Evaluated Result:</strong> ' + working);
    }

    return steps.join('\n');
}

// ================= EVALUATION ENGINE =================
function evaluateUniversal(expr) {
    try {
        if (!expr.trim()) return { result: '0', steps: 'Empty expression entered.' };
        var processed = compileToJS(expr);
        var result = runCompiled(processed);
        var steps = generateSteps(expr);
        return { result: result, steps: steps };
    } catch (e) {
        return { result: 'Error', steps: 'Invalid mathematical expression: ' + e.message };
    }
}

function evaluateArithmetic(expr) { return evaluateUniversal(expr); }

// ================= LOGIC & BOOLEAN WITH TRUTH TABLES =================
function evaluateLogic(expr) {
    var steps = [];
    var raw = expr.trim();
    if (!raw) return { result: 'Error', steps: 'Empty logical expression.' };

    steps.push('<strong>Evaluating Propositional Logic:</strong> ' + raw);
    var clean = raw.replace(/∧/g, ' AND ').replace(/∨/g, ' OR ').replace(/¬/g, ' NOT ')
                   .replace(/⊕/g, ' XOR ').replace(/→/g, ' IMPLIES ').replace(/↔/g, ' EQUIV ');

    // Check for propositional variables (p, q, r, A, B)
    var vars = [];
    var tokens = clean.match(/\b[a-zA-Z]\b/g);
    if (tokens) {
        tokens.forEach(function(t) {
            var upper = t.toUpperCase();
            if (['AND', 'OR', 'NOT', 'XOR', 'IMPLIES', 'EQUIV', 'T', 'F'].indexOf(upper) === -1) {
                if (vars.indexOf(upper) === -1) vars.push(upper);
            }
        });
    }

    if (vars.length > 0 && vars.length <= 4) {
        steps.push('Propositional Variables Identified: [' + vars.join(', ') + ']');
        steps.push('Constructing Truth Table (2<sup>' + vars.length + '</sup> = ' + Math.pow(2, vars.length) + ' rows):');
        var n = vars.length;
        var totalRows = 1 << n;
        var trueCount = 0;
        for (var i = 0; i < totalRows; i++) {
            var assign = {};
            var assignParts = [];
            for (var j = 0; j < n; j++) {
                var val = Boolean(i & (1 << (n - 1 - j)));
                assign[vars[j]] = val;
                assignParts.push(vars[j] + ' = ' + (val ? 'T' : 'F'));
            }
            var rowCode = clean;
            for (var vIdx = 0; vIdx < vars.length; vIdx++) {
                var vName = vars[vIdx];
                rowCode = rowCode.replace(new RegExp('\\b' + vName + '\\b', 'gi'), assign[vName] ? 'true' : 'false');
            }
            rowCode = rowCode.replace(/\bAND\b/gi, '&&').replace(/\bOR\b/gi, '||').replace(/\bNOT\b/gi, '!')
                             .replace(/\bXOR\b/gi, ' !== ')
                             .replace(/(.+?)\s*IMPLIES\s*(.+)/, '(!($1) || ($2))')
                             .replace(/(.+?)\s*EQUIV\s*(.+)/, '($1 === $2)');
            var rowRes = false;
            try { rowRes = Boolean(Function('return (' + rowCode + ')')()); } catch(e) {}
            if (rowRes) trueCount++;
            steps.push('Row ' + (i + 1) + ': [' + assignParts.join(', ') + '] → Statement evaluates to <strong>' + (rowRes ? 'T' : 'F') + '</strong>');
        }

        var classification = '';
        if (trueCount === totalRows) classification = 'TAUTOLOGY (Always TRUE for all assignments)';
        else if (trueCount === 0) classification = 'CONTRADICTION (Always FALSE for all assignments)';
        else classification = 'CONTINGENCY (True for ' + trueCount + '/' + totalRows + ' assignments)';
        steps.push('Logical Classification: <strong>' + classification + '</strong>');
        return { result: classification.split(' ')[0], steps: steps.join('\n') };
    }

    // Step-by-step reduction of constant boolean expressions
    var working = clean;
    var guard = 0;

    var parenRe = /\(([^()]+)\)/;
    while (parenRe.test(working) && guard < 10) {
        guard++;
        var pm = parenRe.exec(working);
        var subExpr = pm[1];
        var subRes = evalSimpleBool(subExpr);
        steps.push('Evaluate innermost group (' + subExpr + '): <strong>' + subRes.val + '</strong> (' + subRes.rule + ')');
        working = working.slice(0, pm.index) + subRes.val + working.slice(pm.index + pm[0].length);
        steps.push('→ Statement is now: <code>' + working + '</code>');
    }

    var finalStep = evalSimpleBool(working);
    steps.push('Final Evaluation: <strong>' + finalStep.val + '</strong> (' + finalStep.rule + ')');
    return { result: finalStep.val, steps: steps.join('\n') };
}

function evalSimpleBool(str) {
    var cur = str.trim();
    var notRe = /\bNOT\s+(TRUE|FALSE)\b/i;
    while (notRe.test(cur)) {
        cur = cur.replace(notRe, function(_, v) {
            return v.toUpperCase() === 'TRUE' ? 'FALSE' : 'TRUE';
        });
    }
    var andRe = /\b(TRUE|FALSE)\s+AND\s+(TRUE|FALSE)\b/i;
    while (andRe.test(cur)) {
        cur = cur.replace(andRe, function(_, a, b) {
            return (a.toUpperCase() === 'TRUE' && b.toUpperCase() === 'TRUE') ? 'TRUE' : 'FALSE';
        });
    }
    var xorRe = /\b(TRUE|FALSE)\s+XOR\s+(TRUE|FALSE)\b/i;
    while (xorRe.test(cur)) {
        cur = cur.replace(xorRe, function(_, a, b) {
            return (a.toUpperCase() !== b.toUpperCase()) ? 'TRUE' : 'FALSE';
        });
    }
    var orRe = /\b(TRUE|FALSE)\s+OR\s+(TRUE|FALSE)\b/i;
    while (orRe.test(cur)) {
        cur = cur.replace(orRe, function(_, a, b) {
            return (a.toUpperCase() === 'TRUE' || b.toUpperCase() === 'TRUE') ? 'TRUE' : 'FALSE';
        });
    }
    var impRe = /\b(TRUE|FALSE)\s+IMPLIES\s+(TRUE|FALSE)\b/i;
    while (impRe.test(cur)) {
        cur = cur.replace(impRe, function(_, a, b) {
            return (a.toUpperCase() === 'TRUE' && b.toUpperCase() === 'FALSE') ? 'FALSE' : 'TRUE';
        });
    }
    var eqRe = /\b(TRUE|FALSE)\s+EQUIV\s+(TRUE|FALSE)\b/i;
    while (eqRe.test(cur)) {
        cur = cur.replace(eqRe, function(_, a, b) {
            return (a.toUpperCase() === b.toUpperCase()) ? 'TRUE' : 'FALSE';
        });
    }

    var res = cur.includes('TRUE') ? 'TRUE' : 'FALSE';
    return { val: res, rule: 'Standard propositional truth reduction' };
}

// ================= SET THEORY WITH ELEMENT-WISE COMPUTATION =================
function parseSet(str) {
    str = str.replace(/∅/g, '').trim();
    var match = str.match(/\{([^}]*)\}/);
    if (!match) return null;
    var inner = match[1].trim();
    if (!inner) return [];
    return inner.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
}

function formatSet(arr) {
    if (!arr || arr.length === 0) return '∅';
    var unique = [];
    for (var i = 0; i < arr.length; i++) {
        if (unique.indexOf(arr[i]) === -1) unique.push(arr[i]);
    }
    return '{' + unique.join(', ') + '}';
}

function parseSets(expr) {
    var sets = [];
    var re = /\{([^}]*)\}/g;
    var m;
    while ((m = re.exec(expr)) !== null) {
        var items = m[1].split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
        var uniq = [];
        items.forEach(function(x) { if (uniq.indexOf(x) === -1) uniq.push(x); });
        sets.push(uniq);
    }
    return sets;
}

function evaluateSetTheory(expr) {
    var raw = expr.trim();
    if (!raw) return { result: 'Error', steps: 'Empty set expression.' };
    var steps = [];
    steps.push('<strong>Set Theory Expression:</strong> ' + raw);

    var sets = parseSets(raw);

    // Powerset
    if (raw.indexOf('POWERSET') !== -1 || raw.indexOf('P(') !== -1) {
        var targetSet = sets.length ? sets[0] : ['1', '2'];
        var n = targetSet.length;
        var totalSubsets = Math.pow(2, n);
        steps.push('Target Set A = ' + formatSet(targetSet) + ', Cardinality |A| = ' + n);
        steps.push('Powerset Theorem: A set with n elements has 2<sup>n</sup> subsets. Total subsets = 2<sup>' + n + '</sup> = <strong>' + totalSubsets + '</strong>');
        var subsets = [];
        for (var mask = 0; mask < totalSubsets; mask++) {
            var sub = [];
            var bin = mask.toString(2).padStart(n, '0');
            for (var bit = 0; bit < n; bit++) {
                if (mask & (1 << (n - 1 - bit))) sub.push(targetSet[bit]);
            }
            var subStr = formatSet(sub);
            subsets.push(subStr);
            steps.push('Subset ' + (mask + 1) + ' (Binary mask ' + bin + '): ' + subStr);
        }
        var pRes = '{' + subsets.join(', ') + '}';
        steps.push('Result: P(A) = <strong>' + pRes + '</strong>');
        return { result: pRes, steps: steps.join('\n') };
    }

    // Complement
    if (raw.indexOf('COMPLEMENT') !== -1) {
        var targetC = sets.length ? sets[0] : ['1', '2', '3'];
        var universal = sets.length > 1 ? sets[1] : ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        steps.push('Target Set A = ' + formatSet(targetC));
        steps.push('Universal Domain U = ' + formatSet(universal));
        steps.push('Definition: Aᶜ = U \ A = { x ∈ U | x ∉ A }');
        var comp = [];
        universal.forEach(function(el) {
            if (targetC.indexOf(el) === -1) {
                comp.push(el);
                steps.push('Element ' + el + ' ∈ U: not in A → Retained in complement');
            } else {
                steps.push('Element ' + el + ' ∈ U: present in A → Excluded from complement');
            }
        });
        var cRes = formatSet(comp);
        steps.push('Result Complement Aᶜ = <strong>' + cRes + '</strong> (Cardinality |Aᶜ| = ' + comp.length + ')');
        return { result: cRes, steps: steps.join('\n') };
    }

    if (sets.length >= 2) {
        var A = sets[0], B = sets[1];
        steps.push('Set A = ' + formatSet(A) + '  (Cardinality |A| = ' + A.length + ')');
        steps.push('Set B = ' + formatSet(B) + '  (Cardinality |B| = ' + B.length + ')');

        // Union
        if (raw.indexOf('UNION') !== -1 || raw.indexOf('∪') !== -1) {
            steps.push('Operation: Union (A ∪ B) = { x | x ∈ A or x ∈ B }');
            var union = [].concat(A);
            steps.push('Step 1: Include all elements of Set A: ' + formatSet(A));
            B.forEach(function(b) {
                if (union.indexOf(b) === -1) {
                    union.push(b);
                    steps.push('Step 2: Inspect element ' + b + ' ∈ B → Not in A, append to union');
                } else {
                    steps.push('Step 2: Inspect element ' + b + ' ∈ B → Already in A, skip duplicate');
                }
            });
            var uRes = formatSet(union);
            steps.push('Final Union Set A ∪ B = <strong>' + uRes + '</strong> (Cardinality = ' + union.length + ')');
            return { result: uRes, steps: steps.join('\n') };
        }

        // Intersection
        if (raw.indexOf('INTERSECT') !== -1 || raw.indexOf('∩') !== -1) {
            steps.push('Operation: Intersection (A ∩ B) = { x | x ∈ A and x ∈ B }');
            var inter = [];
            A.forEach(function(a) {
                if (B.indexOf(a) !== -1) {
                    inter.push(a);
                    steps.push('Test element ' + a + ' ∈ A: Also found in Set B? YES → Included in A ∩ B');
                } else {
                    steps.push('Test element ' + a + ' ∈ A: Also found in Set B? NO → Excluded');
                }
            });
            var iRes = formatSet(inter);
            steps.push('Final Intersection Set A ∩ B = <strong>' + iRes + '</strong> (Cardinality = ' + inter.length + ')');
            return { result: iRes, steps: steps.join('\n') };
        }

        // Difference
        if (raw.indexOf('DIFF') !== -1 || raw.indexOf('\\') !== -1) {
            steps.push('Operation: Relative Difference (A \\ B) = { x | x ∈ A and x ∉ B }');
            var diff = [];
            A.forEach(function(a) {
                if (B.indexOf(a) === -1) {
                    diff.push(a);
                    steps.push('Test element ' + a + ' ∈ A: Found in Set B? NO → Retained in A \\ B');
                } else {
                    steps.push('Test element ' + a + ' ∈ A: Found in Set B? YES → Removed');
                }
            });
            var dRes = formatSet(diff);
            steps.push('Final Difference Set A \\ B = <strong>' + dRes + '</strong> (Cardinality = ' + diff.length + ')');
            return { result: dRes, steps: steps.join('\n') };
        }

        // Subset
        if (raw.indexOf('SUBSET') !== -1 || raw.indexOf('⊆') !== -1) {
            steps.push('Operation: Subset Verification (A ⊆ B)');
            steps.push('Definition: A ⊆ B is TRUE if and only if every element x ∈ A satisfies x ∈ B.');
            var isSub = true;
            for (var k = 0; k < A.length; k++) {
                var el = A[k];
                var inB = B.indexOf(el) !== -1;
                steps.push('Check element ' + el + ' ∈ A: Present in B? ' + (inB ? 'YES' : 'NO'));
                if (!inB) isSub = false;
            }
            steps.push('Conclusion: ' + (isSub ? 'Every element of A is contained in B.' : 'At least one element of A is missing from B.'));
            steps.push('Subset Truth Value: <strong>' + (isSub ? 'TRUE' : 'FALSE') + '</strong>');
            return { result: isSub ? 'TRUE' : 'FALSE', steps: steps.join('\n') };
        }
    }

    // Symbolic fallback
    steps.push('<strong>Set Operator Definitions:</strong>');
    steps.push('• <strong>UNION (A ∪ B):</strong> Elements in A or B or both (e.g. {1,2} ∪ {2,3} = {1,2,3})');
    steps.push('• <strong>INTERSECTION (A ∩ B):</strong> Elements present in both (e.g. {1,2} ∩ {2,3} = {2})');
    steps.push('• <strong>DIFFERENCE (A \\ B):</strong> Elements in A but not in B (e.g. {1,2,3} \\ {2} = {1,3})');
    steps.push('• <strong>POWERSET (P(A)):</strong> Set of all 2<sup>n</sup> subsets including ∅');
    return { result: 'A ∪ B', steps: steps.join('\n') };
}

// ================= COMBINATORICS WITH PROOFS =================
function evaluateCombinatorics(expr) {
    var raw = expr.trim();
    var steps = [];
    steps.push('<strong>Combinatorics Evaluation:</strong> ' + raw);

    var norm = raw.replace(/(\d+)\s*(?:nCr|C)\s*(\d+)/gi, 'nCr($1, $2)');
    norm = norm.replace(/(\d+)\s*(?:nPr|P)\s*(\d+)/gi, 'nPr($1, $2)');

    var singleNCR = norm.match(/^nCr\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (singleNCR) {
        var n = parseInt(singleNCR[1], 10), r = parseInt(singleNCR[2], 10);
        if (r > n) return { result: 'Error', steps: 'Error: r (' + r + ') cannot exceed n (' + n + ').' };
        var fn = fact(n), fr = fact(r), fnr = fact(n - r);
        var den = fr * fnr;
        var res = fn / den;
        var seqN = []; for(var i=n; i>=1; i--) seqN.push(i);
        var seqR = []; for(var j=r; j>=1; j--) seqR.push(j);
        var seqNR = []; for(var k=n-r; k>=1; k--) seqNR.push(k);
        steps.push('Formula: C(n, r) = n! / [r! × (n − r)!]');
        steps.push('Parameters: Total items n = ' + n + ', Selected items r = ' + r);
        steps.push('Step 1: Compute n! (' + n + '!): ' + (seqN.length ? seqN.join(' × ') : '1') + ' = ' + fn);
        steps.push('Step 2: Compute r! (' + r + '!): ' + (seqR.length ? seqR.join(' × ') : '1') + ' = ' + fr);
        steps.push('Step 3: Compute (n - r)! (' + (n - r) + '!): ' + (seqNR.length ? seqNR.join(' × ') : '1') + ' = ' + fnr);
        steps.push('Step 4: Denominator product = r! × (n − r)! = ' + fr + ' × ' + fnr + ' = ' + den);
        steps.push('Step 5: Final division = ' + fn + ' ÷ ' + den + ' = <strong>' + res + '</strong>');
        steps.push('<em>Combinatorial Meaning: There are ' + res + ' distinct ways to select ' + r + ' items from a set of ' + n + ' items without regard to order.</em>');
        return { result: res, steps: steps.join('\n') };
    }

    var singleNPR = norm.match(/^nPr\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (singleNPR) {
        var n2 = parseInt(singleNPR[1], 10), r2 = parseInt(singleNPR[2], 10);
        if (r2 > n2) return { result: 'Error', steps: 'Error: r (' + r2 + ') cannot exceed n (' + n2 + ').' };
        var fn2 = fact(n2), fnr2 = fact(n2 - r2);
        var res2 = fn2 / fnr2;
        var seqN2 = []; for(var i2=n2; i2>=1; i2--) seqN2.push(i2);
        var seqNR2 = []; for(var k2=n2-r2; k2>=1; k2--) seqNR2.push(k2);
        steps.push('Formula: P(n, r) = n! / (n − r)!');
        steps.push('Parameters: Total items n = ' + n2 + ', Arranged items r = ' + r2);
        steps.push('Step 1: Compute n! (' + n2 + '!): ' + (seqN2.length ? seqN2.join(' × ') : '1') + ' = ' + fn2);
        steps.push('Step 2: Compute (n - r)! (' + (n2 - r2) + '!): ' + (seqNR2.length ? seqNR2.join(' × ') : '1') + ' = ' + fnr2);
        steps.push('Step 3: Final division = ' + fn2 + ' ÷ ' + fnr2 + ' = <strong>' + res2 + '</strong>');
        steps.push('<em>Combinatorial Meaning: There are ' + res2 + ' distinct ordered arrangements when selecting ' + r2 + ' items from ' + n2 + ' items.</em>');
        return { result: res2, steps: steps.join('\n') };
    }

    var singleFact = norm.match(/^(\d+)!$/);
    if (singleFact) {
        var n3 = parseInt(singleFact[1], 10);
        var res3 = fact(n3);
        var seq3 = []; for(var i3=n3; i3>=1; i3--) seq3.push(i3);
        steps.push('Factorial Definition: n! is the product of all positive integers from 1 up to n.');
        steps.push(n3 + '! = ' + (seq3.length ? seq3.join(' × ') : '1') + ' = <strong>' + res3 + '</strong>');
        return { result: res3, steps: steps.join('\n') };
    }

    return evaluateUniversal(expr);
}

// ================= NUMBER THEORY =================
function evaluateNumberTheory(expr) {
    var u = expr.toLowerCase();

    var m = u.match(/gcd\s*\(?\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        var g = extendedGcdWithSteps(parseInt(m[1], 10), parseInt(m[2], 10));
        return { result: g.gcd, steps: g.steps.join('\n') };
    }

    m = u.match(/lcm\s*\(?\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        var a2 = parseInt(m[1], 10), b2 = parseInt(m[2], 10);
        var gStep = extendedGcdWithSteps(a2, b2);
        var prod = a2 * b2;
        var l = prod / gStep.gcd;
        var steps = gStep.steps.concat([
            '<strong>LCM Formula:</strong> lcm(a, b) = (|a × b|) / gcd(a, b)',
            'Step 1: Product = ' + a2 + ' × ' + b2 + ' = ' + prod,
            'Step 2: Divide by GCD = ' + prod + ' ÷ ' + gStep.gcd + ' = <strong>' + l + '</strong>'
        ]);
        return { result: l, steps: steps.join('\n') };
    }

    m = u.match(/modpow\s*\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        var base = parseInt(m[1], 10), exp = parseInt(m[2], 10), modVal = parseInt(m[3], 10);
        if (modVal === 0) return { result: 'Error', steps: 'Error: Modulo cannot be 0.' };
        var mpSteps = ['<strong>Modular Exponentiation (' + base + '<sup>' + exp + '</sup> mod ' + modVal + ') via Binary Exponentiation:</strong>'];
        mpSteps.push('Binary representation of exponent ' + exp + ': ' + exp.toString(2));
        var curBase = base % modVal;
        var curExp = exp;
        var mpRes = 1;
        var stepCount = 1;
        while (curExp > 0) {
            if (curExp % 2 === 1) {
                var prevRes = mpRes;
                mpRes = (mpRes * curBase) % modVal;
                mpSteps.push('Step ' + stepCount + ' (Bit 1): Multiply result = (' + prevRes + ' × ' + curBase + ') mod ' + modVal + ' = <strong>' + mpRes + '</strong>');
            } else {
                mpSteps.push('Step ' + stepCount + ' (Bit 0): Exponent bit is 0, result remains <strong>' + mpRes + '</strong>');
            }
            curExp = Math.floor(curExp / 2);
            if (curExp > 0) {
                var prevBase = curBase;
                curBase = (curBase * curBase) % modVal;
                mpSteps.push('  Square base: (' + prevBase + ')² mod ' + modVal + ' = ' + (prevBase * prevBase) + ' mod ' + modVal + ' = ' + curBase);
            }
            stepCount++;
        }
        mpSteps.push('Final Result (' + base + '<sup>' + exp + '</sup> mod ' + modVal + ') = <strong>' + mpRes + '</strong>');
        return { result: mpRes, steps: mpSteps.join('\n') };
    }

    m = u.match(/phi\s*\(?\s*(\d+)/);
    if (m) {
        var pn = parseInt(m[1], 10);
        var phiSteps = ['<strong>Euler\'s Totient Function φ(' + pn + '):</strong>'];
        phiSteps.push('φ(n) counts integers k in 1 ≤ k ≤ n such that gcd(k, n) = 1.');
        var temp = pn;
        var pFactors = [];
        for (var p = 2; p * p <= temp; p++) {
            if (temp % p === 0) {
                pFactors.push(p);
                while (temp % p === 0) temp /= p;
            }
        }
        if (temp > 1) pFactors.push(temp);
        phiSteps.push('Step 1 (Distinct Prime Factors of ' + pn + '): [' + pFactors.join(', ') + ']');

        var phiCalc = pn;
        var productTerms = [];
        pFactors.forEach(function(pf) {
            phiCalc = phiCalc * (pf - 1) / pf;
            productTerms.push('(1 − 1/' + pf + ')');
        });
        phiSteps.push('Step 2 (Euler Product Formula): φ(n) = n × ∏ (1 − 1/p)');
        phiSteps.push('φ(' + pn + ') = ' + pn + ' × ' + productTerms.join(' × ') + ' = <strong>' + phiCalc + '</strong>');

        var coprimes = [];
        for (var k = 1; k <= pn; k++) {
            if (gcd(k, pn) === 1 && coprimes.length < 20) coprimes.push(k);
        }
        phiSteps.push('Coprime integers with ' + pn + ': {' + coprimes.join(', ') + (phiCalc > 20 ? ', ...' : '') + '}');
        return { result: phiCalc, steps: phiSteps.join('\n') };
    }

    m = u.match(/mod\s*\(?\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
        var md = parseInt(m[1], 10), dv = parseInt(m[2], 10);
        if (dv === 0) return { result: 'Error', steps: 'Error: Division by zero in mod operation.' };
        var q = Math.floor(md / dv);
        var mm = md - q * dv;
        var steps4 = [
            '<strong>Modulo Definition (Dividend mod Divisor):</strong>',
            'Step 1: Integer Quotient = ⌊' + md + ' ÷ ' + dv + '⌋ = ' + q,
            'Step 2: Remainder = ' + md + ' − (' + q + ' × ' + dv + ') = ' + md + ' − ' + (q * dv) + ' = <strong>' + mm + '</strong>',
            'Verification: ' + md + ' = (' + q + ' × ' + dv + ') + ' + mm + '  (where 0 ≤ ' + mm + ' < ' + dv + ')',
            'Result: ' + md + ' mod ' + dv + ' = <strong>' + mm + '</strong>'
        ];
        return { result: mm, steps: steps4.join('\n') };
    }

    m = u.match(/prime\?\s*\(?\s*(\d+)/);
    if (m) {
        var numP = parseInt(m[1], 10);
        var steps5 = ['<strong>Primality Test for ' + numP + ':</strong>'];
        if (numP < 2) {
            steps5.push(numP + ' is less than 2, therefore it is NOT prime.');
            return { result: 'FALSE', steps: steps5.join('\n') };
        }
        var isPrime = true;
        var limit = Math.floor(Math.sqrt(numP));
        steps5.push('Step 1: Calculate trial division limit ⌊√' + numP + '⌋ = ' + limit);
        steps5.push('Step 2: Test candidate divisors 2, 3, 5, 7, ... up to ' + limit);
        for (var di = 2; di <= limit; di++) {
            if (numP % di === 0) {
                steps5.push('  Candidate ' + di + ': ' + numP + ' ÷ ' + di + ' = ' + (numP / di) + ' (Exact division! Factor found)');
                isPrime = false;
                break;
            } else {
                steps5.push('  Candidate ' + di + ': ' + numP + ' ÷ ' + di + ' = ' + Math.floor(numP / di) + ' R ' + (numP % di) + ' (Not a divisor)');
            }
        }
        if (isPrime) {
            steps5.push('Conclusion: No divisor found between 2 and ' + limit + '. ' + numP + ' is <strong>PRIME</strong>.');
        } else {
            steps5.push('Conclusion: Composite number with factor ' + di + '. ' + numP + ' is <strong>COMPOSITE</strong>.');
        }
        return { result: isPrime ? 'TRUE' : 'FALSE', steps: steps5.join('\n') };
    }

    m = u.match(/factor\s*\(?\s*(\d+)/);
    if (m) {
        var numF = parseInt(m[1], 10);
        if (numF < 2) return { result: 'Error', steps: 'Number must be ≥ 2 for prime factorization.' };
        var factors = [];
        var steps6 = ['<strong>Prime Factorization of ' + numF + ':</strong>'];
        var d = 2, x = numF;
        var stepNum = 1;
        while (d * d <= x) {
            while (x % d === 0) {
                var nextX = x / d;
                steps6.push('Step ' + stepNum + ': ' + x + ' ÷ ' + d + ' = ' + nextX + '  (Prime factor ' + d + ')');
                factors.push(d);
                x = nextX;
                stepNum++;
            }
            d++;
        }
        if (x > 1) {
            factors.push(x);
            steps6.push('Step ' + stepNum + ': ' + x + ' is prime (Final factor)');
        }

        var counts = {};
        for (var fi = 0; fi < factors.length; fi++) {
            counts[factors[fi]] = (counts[factors[fi]] || 0) + 1;
        }
        var powerForm = Object.keys(counts).map(function(k) {
            return counts[k] > 1 ? (k + '<sup>' + counts[k] + '</sup>') : k;
        }).join(' × ');

        steps6.push('Prime Factor List: ' + factors.join(' × '));
        steps6.push('Canonical Exponential Form: <strong>' + powerForm + '</strong>');
        return { result: factors.join(' × '), steps: steps6.join('\n') };
    }

    return evaluateUniversal(expr);
}

// ================= CONVERSION =================
function evaluateConversion(expr) {
    var m = expr.match(/(DEC → BINARY|BIN → DECIMAL|DEC → HEX|HEX → DECIMAL|DEC → OCT|OCT → DECIMAL|BIN → HEX|HEX → BINARY|BIN → OCT|OCT → BINARY)\s+(\S+)/i);
    if (!m) return { result: 'Error', steps: 'Format: DEC → BINARY 255 (tap a conversion button, then enter the value)' };
    var type = m[1].toUpperCase(), val = m[2];

    try {
        if (type === 'DEC → BINARY') {
            var r1 = toBaseWithSteps(parseInt(val, 10), 2);
            return { result: r1.result, steps: r1.steps.join('\n') };
        }
        if (type === 'BIN → DECIMAL') {
            var r2 = fromBaseWithSteps(val, 2);
            return { result: r2.result, steps: r2.steps.join('\n') };
        }
        if (type === 'DEC → HEX') {
            var r3 = toBaseWithSteps(parseInt(val, 10), 16);
            return { result: r3.result, steps: r3.steps.join('\n') };
        }
        if (type === 'HEX → DECIMAL') {
            var r4 = fromBaseWithSteps(val, 16);
            return { result: r4.result, steps: r4.steps.join('\n') };
        }
        if (type === 'DEC → OCT') {
            var r5 = toBaseWithSteps(parseInt(val, 10), 8);
            return { result: r5.result, steps: r5.steps.join('\n') };
        }
        if (type === 'OCT → DECIMAL') {
            var r6 = fromBaseWithSteps(val, 8);
            return { result: r6.result, steps: r6.steps.join('\n') };
        }
        if (type === 'BIN → HEX') {
            var stepsNibbles = ['<strong>Binary to Hexadecimal 4-bit Nibble Grouping:</strong>'];
            var cleanBin = val.replace(/\s+/g, '');
            var padLen = (4 - (cleanBin.length % 4)) % 4;
            var paddedBin = '0'.repeat(padLen) + cleanBin;
            stepsNibbles.push('Input: <code>' + cleanBin + '</code> (Padded to 4-bit groups: <code>' + paddedBin + '</code>)');
            var hexRes = '';
            for (var ni = 0; ni < paddedBin.length; ni += 4) {
                var nibble = paddedBin.slice(ni, ni + 4);
                var decVal = parseInt(nibble, 2);
                var hexDigit = decVal.toString(16).toUpperCase();
                hexRes += hexDigit;
                stepsNibbles.push('Nibble <code>' + nibble + '</code>: (' + nibble[0] + '×8 + ' + nibble[1] + '×4 + ' + nibble[2] + '×2 + ' + nibble[3] + '×1) = ' + decVal + ' → Hex <strong>' + hexDigit + '</strong>');
            }
            stepsNibbles.push('Final Hexadecimal: <strong>0x' + hexRes + '</strong>');
            return { result: hexRes, steps: stepsNibbles.join('\n') };
        }
        if (type === 'HEX → BINARY') {
            var stepsHexBin = ['<strong>Hexadecimal to Binary (4-bit per Hex Digit):</strong>'];
            var cleanHex = val.toUpperCase().replace(/^0X/, '');
            var binRes2 = '';
            for (var hi = 0; hi < cleanHex.length; hi++) {
                var ch = cleanHex[hi];
                var hDec = parseInt(ch, 16);
                var hBin = hDec.toString(2).padStart(4, '0');
                binRes2 += hBin;
                stepsHexBin.push('Hex digit \'' + ch + '\' = ' + hDec + ' → 4-bit binary <code>' + hBin + '</code>');
            }
            stepsHexBin.push('Concatenated Binary Result: <strong>' + binRes2 + '</strong>');
            return { result: binRes2, steps: stepsHexBin.join('\n') };
        }
    } catch (e) { return { result: 'Error', steps: 'Invalid numeric input: ' + e.message }; }
    return { result: 'Error', steps: 'Unknown conversion request' };
}

// ================= MATRIX ALGEBRA (2x2) =================
function evaluateMatrix(expr) {
    var raw = expr.trim();
    var u = raw.toLowerCase().replace(/[\[\]]/g, ' ');

    // det2x2(a, b, c, d)
    var m = u.match(/det2x2\s*\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (m) {
        var a = +m[1], b = +m[2], c = +m[3], d = +m[4];
        var ad = a * d, bc = b * c, det = ad - bc;
        if (typeof det === 'number' && !Number.isInteger(det)) det = parseFloat(det.toFixed(6));
        var steps = [
            '<strong>2×2 Matrix Determinant:</strong>',
            'Matrix A = [ [' + a + ', ' + b + '], [' + c + ', ' + d + '] ]',
            'Formula: det(A) = (a × d) − (b × c)',
            'Step 1 (Main Diagonal Product): ' + a + ' × ' + d + ' = ' + ad,
            'Step 2 (Anti-Diagonal Product): ' + b + ' × ' + c + ' = ' + bc,
            'Step 3 (Difference): det(A) = ' + ad + ' − (' + bc + ') = <strong>' + det + '</strong>',
            det === 0 ? '<em>Matrix is singular (det = 0): No inverse exists.</em>' : '<em>Matrix is non-singular (det ≠ 0): Unique inverse exists.</em>'
        ];
        return { result: det, steps: steps.join('\n') };
    }

    // inv2x2(a, b, c, d)
    m = u.match(/inv2x2\s*\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (m) {
        var a2 = +m[1], b2 = +m[2], c2 = +m[3], d2 = +m[4];
        var det2 = a2 * d2 - b2 * c2;
        var stepsInv = [
            '<strong>2×2 Matrix Inversion:</strong>',
            'Matrix A = [ [' + a2 + ', ' + b2 + '], [' + c2 + ', ' + d2 + '] ]',
            'Inversion Formula: A<sup>−1</sup> = (1 / det(A)) × [ [d, −b], [−c, a] ]'
        ];
        if (det2 === 0) {
            stepsInv.push('Step 1: det(A) = (' + a2 + ' × ' + d2 + ') − (' + b2 + ' × ' + c2 + ') = 0');
            stepsInv.push('<strong>Error: Matrix is singular. Division by determinant zero is undefined.</strong>');
            return { result: 'Singular (No Inverse)', steps: stepsInv.join('\n') };
        }
        var invA = (d2 / det2).toFixed(4), invB = (-b2 / det2).toFixed(4);
        var invC = (-c2 / det2).toFixed(4), invD = (a2 / det2).toFixed(4);
        stepsInv.push('Step 1 (Determinant): det(A) = (' + a2 + ' × ' + d2 + ') − (' + b2 + ' × ' + c2 + ') = ' + det2);
        stepsInv.push('Step 2 (Adjugate Matrix): adj(A) = [ [' + d2 + ', ' + (-b2) + '], [' + (-c2) + ', ' + a2 + '] ]');
        stepsInv.push('Step 3 (Scalar Division by det):');
        stepsInv.push('  Row 1, Col 1: ' + d2 + ' / ' + det2 + ' = ' + invA);
        stepsInv.push('  Row 1, Col 2: ' + (-b2) + ' / ' + det2 + ' = ' + invB);
        stepsInv.push('  Row 2, Col 1: ' + (-c2) + ' / ' + det2 + ' = ' + invC);
        stepsInv.push('  Row 2, Col 2: ' + a2 + ' / ' + det2 + ' = ' + invD);
        var resInv = '[ [' + invA + ', ' + invB + '], [' + invC + ', ' + invD + '] ]';
        stepsInv.push('Inverse Matrix A<sup>−1</sup> = <strong>' + resInv + '</strong>');
        return { result: resInv, steps: stepsInv.join('\n') };
    }

    // trans2x2(a, b, c, d)
    m = u.match(/trans2x2\s*\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (m) {
        var ta = +m[1], tb = +m[2], tc = +m[3], td = +m[4];
        var stepsTrans = [
            '<strong>2×2 Matrix Transposition:</strong>',
            'Matrix A = [ [' + ta + ', ' + tb + '], [' + tc + ', ' + td + '] ]',
            'Definition: Transpose Aᵀ reflects entries across the main diagonal ((Aᵀ)ᵢⱼ = Aⱼᵢ)',
            'Row 1 [' + ta + ', ' + tb + '] becomes Column 1',
            'Row 2 [' + tc + ', ' + td + '] becomes Column 2',
            'Transpose Result Aᵀ = <strong>[ [' + ta + ', ' + tc + '], [' + tb + ', ' + td + '] ]</strong>'
        ];
        return { result: '[ [' + ta + ', ' + tc + '], [' + tb + ', ' + td + '] ]', steps: stepsTrans.join('\n') };
    }

    // trace2x2(a, b, c, d)
    m = u.match(/trace2x2\s*\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (m) {
        var tra = +m[1], trb = +m[2], trc = +m[3], trd = +m[4];
        var trVal = tra + trd;
        var stepsTrace = [
            '<strong>2×2 Matrix Trace:</strong>',
            'Matrix A = [ [' + tra + ', ' + trb + '], [' + trc + ', ' + trd + '] ]',
            'Definition: tr(A) is the sum of main diagonal entries: a₁₁ + a₂₂',
            'Step 1: Identify diagonal elements: a₁₁ = ' + tra + ', a₂₂ = ' + trd,
            'Step 2: Sum = ' + tra + ' + ' + trd + ' = <strong>' + trVal + '</strong>'
        ];
        return { result: trVal, steps: stepsTrace.join('\n') };
    }

    // add2x2
    m = u.match(/add2x2\s*\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (m) {
        var vals = m.slice(1, 9).map(Number);
        var r11 = vals[0] + vals[4], r12 = vals[1] + vals[5], r21 = vals[2] + vals[6], r22 = vals[3] + vals[7];
        var steps2 = [
            '<strong>2×2 Matrix Addition:</strong>',
            'Matrix A = [ [' + vals[0] + ', ' + vals[1] + '], [' + vals[2] + ', ' + vals[3] + '] ]',
            'Matrix B = [ [' + vals[4] + ', ' + vals[5] + '], [' + vals[6] + ', ' + vals[7] + '] ]',
            'Row 1, Col 1: ' + vals[0] + ' + ' + vals[4] + ' = <strong>' + r11 + '</strong>',
            'Row 1, Col 2: ' + vals[1] + ' + ' + vals[5] + ' = <strong>' + r12 + '</strong>',
            'Row 2, Col 1: ' + vals[2] + ' + ' + vals[6] + ' = <strong>' + r21 + '</strong>',
            'Row 2, Col 2: ' + vals[3] + ' + ' + vals[7] + ' = <strong>' + r22 + '</strong>',
            'Sum Matrix A + B = <strong>[ [' + r11 + ', ' + r12 + '], [' + r21 + ', ' + r22 + '] ]</strong>'
        ];
        return { result: '[ [' + r11 + ', ' + r12 + '], [' + r21 + ', ' + r22 + '] ]', steps: steps2.join('\n') };
    }

    // mul2x2
    m = u.match(/mul2x2\s*\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (m) {
        var v = m.slice(1, 9).map(Number);
        var r1c1 = v[0] * v[4] + v[1] * v[6];
        var r1c2 = v[0] * v[5] + v[1] * v[7];
        var r2c1 = v[2] * v[4] + v[3] * v[6];
        var r2c2 = v[2] * v[5] + v[3] * v[7];
        var steps3 = [
            '<strong>2×2 Matrix Multiplication (Row · Column Dot Products):</strong>',
            'Matrix A = [ [' + v[0] + ', ' + v[1] + '], [' + v[2] + ', ' + v[3] + '] ]',
            'Matrix B = [ [' + v[4] + ', ' + v[5] + '], [' + v[6] + ', ' + v[7] + '] ]',
            'Cell (1,1): (' + v[0] + ' × ' + v[4] + ') + (' + v[1] + ' × ' + v[6] + ') = ' + (v[0]*v[4]) + ' + ' + (v[1]*v[6]) + ' = <strong>' + r1c1 + '</strong>',
            'Cell (1,2): (' + v[0] + ' × ' + v[5] + ') + (' + v[1] + ' × ' + v[7] + ') = ' + (v[0]*v[5]) + ' + ' + (v[1]*v[7]) + ' = <strong>' + r1c2 + '</strong>',
            'Cell (2,1): (' + v[2] + ' × ' + v[4] + ') + (' + v[3] + ' × ' + v[6] + ') = ' + (v[2]*v[4]) + ' + ' + (v[3]*v[6]) + ' = <strong>' + r2c1 + '</strong>',
            'Cell (2,2): (' + v[2] + ' × ' + v[5] + ') + (' + v[3] + ' × ' + v[7] + ') = ' + (v[2]*v[5]) + ' + ' + (v[3]*v[7]) + ' = <strong>' + r2c2 + '</strong>',
            'Product Matrix AB = <strong>[ [' + r1c1 + ', ' + r1c2 + '], [' + r2c1 + ', ' + r2c2 + '] ]</strong>'
        ];
        return { result: '[ [' + r1c1 + ', ' + r1c2 + '], [' + r2c1 + ', ' + r2c2 + '] ]', steps: steps3.join('\n') };
    }

    return { result: 'Error', steps: 'Supported Matrix operations: det2x2(a,b,c,d), inv2x2(a,b,c,d), trans2x2(a,b,c,d), trace2x2(a,b,c,d), add2x2(a..h), mul2x2(a..h)' };
}

// ================= COMPLEX NUMBERS =================
function parseComplex(str) {
    str = str.replace(/\s+/g, '').replace(/^\(/, '').replace(/\)$/, '');
    if (!str) return null;
    var mPureI = str.match(/^([+-]?\d*(?:\.\d+)?)i$/i);
    if (mPureI) {
        var s = mPureI[1];
        var val = (s === '' || s === '+') ? 1 : (s === '-' ? -1 : parseFloat(s));
        return { re: 0, im: val };
    }
    var mFull = str.match(/^([+-]?\d+(?:\.\d+)?)([+-]\d*(?:\.\d+)?)i$/i);
    if (mFull) {
        var re = parseFloat(mFull[1]);
        var imStr = mFull[2];
        var im = (imStr === '+' || imStr === '') ? 1 : (imStr === '-' ? -1 : parseFloat(imStr));
        return { re: re, im: im };
    }
    var num = parseFloat(str);
    if (!isNaN(num)) return { re: num, im: 0 };
    return null;
}

function evaluateComplex(expr) {
    var raw = expr.trim();
    var lower = raw.toLowerCase();

    // Check unary functions: re(z), im(z), conj(z), abs(z), arg(z), polar(z)
    var fn = lower.match(/^(re|im|conj|abs|arg|polar)\((.+)\)$/);
    if (fn) {
        var c = parseComplex(fn[2]);
        if (!c) return { result: 'Error', steps: 'Could not parse complex number format (e.g. 3+4i, 5-2i).' };
        var label = '<strong>Complex Number z:</strong> ' + c.re + (c.im >= 0 ? ' + ' : ' − ') + Math.abs(c.im) + 'i  (Real part a = ' + c.re + ', Imaginary part b = ' + c.im + ')';

        if (fn[1] === 're') return { result: c.re, steps: label + '\nRe(a + bi) = a\nRe(' + fn[2] + ') = <strong>' + c.re + '</strong>' };
        if (fn[1] === 'im') return { result: c.im, steps: label + '\nIm(a + bi) = b\nIm(' + fn[2] + ') = <strong>' + c.im + '</strong>' };
        if (fn[1] === 'conj') {
            var conj = c.re + (-c.im >= 0 ? '+' : '') + (-c.im) + 'i';
            return { result: conj, steps: label + '\n<strong>Complex Conjugate:</strong> Invert sign of imaginary component (a + bi → a − bi)\nz* = <strong>' + conj + '</strong>' };
        }
        if (fn[1] === 'abs') {
            var sq = c.re * c.re + c.im * c.im;
            var mag = Math.sqrt(sq);
            return { result: mag, steps: label + '\n<strong>Modulus |z|:</strong> |a + bi| = √(a² + b²)\n= √(' + c.re + '² + ' + c.im + '²)\n= √(' + (c.re * c.re) + ' + ' + (c.im * c.im) + ')\n= √' + sq + ' = <strong>' + mag.toFixed(4) + '</strong>' };
        }
        if (fn[1] === 'arg') {
            var ang = Math.atan2(c.im, c.re);
            var deg = (ang * 180 / Math.PI);
            return { result: ang.toFixed(4) + ' rad', steps: label + '\n<strong>Argument θ:</strong> arg(z) = atan2(b, a)\n= atan2(' + c.im + ', ' + c.re + ')\n= <strong>' + ang.toFixed(4) + ' radians (' + deg.toFixed(2) + '°)</strong>' };
        }
        if (fn[1] === 'polar') {
            var magP = Math.sqrt(c.re * c.re + c.im * c.im);
            var angP = Math.atan2(c.im, c.re);
            return { result: magP.toFixed(3) + '∠' + (angP * 180 / Math.PI).toFixed(1) + '°', steps: label + '\n<strong>Polar Form (r e<sup>iθ</sup>):</strong>\nr = |z| = ' + magP.toFixed(4) + '\nθ = ' + angP.toFixed(4) + ' rad\nPolar Representation: <strong>' + magP.toFixed(4) + ' · e<sup>' + angP.toFixed(4) + 'i</sup></strong>' };
        }
    }

    // Check complex binary arithmetic: (z1) OP (z2)
    var binMatch = raw.match(/^\s*\(?([^()]+?)\)?\s*([*\/+\-])\s*\(?([^()]+?)\)?\s*$/);
    if (binMatch && (binMatch[1].includes('i') || binMatch[3].includes('i'))) {
        var z1 = parseComplex(binMatch[1]);
        var op = binMatch[2];
        var z2 = parseComplex(binMatch[3]);
        if (z1 && z2) {
            var a = z1.re, b = z1.im, c2 = z2.re, d = z2.im;
            var stepsOp = [];
            var sign1 = b >= 0 ? '+' : '-';
            var sign2 = d >= 0 ? '+' : '-';
            stepsOp.push('<strong>Complex Arithmetic:</strong> (' + a + ' ' + sign1 + ' ' + Math.abs(b) + 'i) ' + op + ' (' + c2 + ' ' + sign2 + ' ' + Math.abs(d) + 'i)');

            if (op === '+') {
                var sumRe = a + c2;
                var sumIm = b + d;
                stepsOp.push('Step 1 (Add Real Parts): ' + a + ' + ' + c2 + ' = <strong>' + sumRe + '</strong>');
                stepsOp.push('Step 2 (Add Imaginary Parts): (' + b + ' + ' + d + ')i = <strong>' + sumIm + 'i</strong>');
                var resSum = sumRe + ' ' + (sumIm >= 0 ? '+' : '-') + ' ' + Math.abs(sumIm) + 'i';
                stepsOp.push('Sum = <strong>' + resSum + '</strong>');
                return { result: resSum, steps: stepsOp.join('\n') };
            }
            if (op === '-') {
                var diffRe = a - c2;
                var diffIm = b - d;
                stepsOp.push('Step 1 (Subtract Real Parts): ' + a + ' − (' + c2 + ') = <strong>' + diffRe + '</strong>');
                stepsOp.push('Step 2 (Subtract Imaginary Parts): (' + b + ' − (' + d + '))i = <strong>' + diffIm + 'i</strong>');
                var resDiff = diffRe + ' ' + (diffIm >= 0 ? '+' : '-') + ' ' + Math.abs(diffIm) + 'i';
                stepsOp.push('Difference = <strong>' + resDiff + '</strong>');
                return { result: resDiff, steps: stepsOp.join('\n') };
            }
            if (op === '*') {
                stepsOp.push('Apply FOIL Method: (a + bi)(c + di) = ac + adi + bci + bdi²');
                var ac = a * c2, ad = a * d, bc = b * c2, bd = b * d;
                stepsOp.push('Step 1 (First terms): ' + a + ' × ' + c2 + ' = ' + ac);
                stepsOp.push('Step 2 (Outside terms): ' + a + ' × ' + d + 'i = ' + ad + 'i');
                stepsOp.push('Step 3 (Inside terms): ' + b + 'i × ' + c2 + ' = ' + bc + 'i');
                stepsOp.push('Step 4 (Last terms): ' + b + 'i × ' + d + 'i = ' + bd + 'i² = ' + bd + ' × (-1) = ' + (-bd));
                var realPart = ac - bd;
                var imagPart = ad + bc;
                stepsOp.push('Step 5 (Combine Real parts): ' + ac + ' + (' + (-bd) + ') = <strong>' + realPart + '</strong>');
                stepsOp.push('Step 6 (Combine Imaginary parts): (' + ad + ' + ' + bc + ')i = <strong>' + imagPart + 'i</strong>');
                var resMul = realPart + ' ' + (imagPart >= 0 ? '+' : '-') + ' ' + Math.abs(imagPart) + 'i';
                stepsOp.push('Product = <strong>' + resMul + '</strong>');
                return { result: resMul, steps: stepsOp.join('\n') };
            }
            if (op === '/') {
                var den = (c2 * c2) + (d * d);
                if (den === 0) {
                    stepsOp.push('Error: Denominator is 0. Division by zero is undefined.');
                    return { result: 'Undefined', steps: stepsOp.join('\n') };
                }
                stepsOp.push('Step 1: Identify complex conjugate of denominator: (' + c2 + ' ' + (d >= 0 ? '−' : '+') + ' ' + Math.abs(d) + 'i)');
                stepsOp.push('Step 2: Multiply numerator and denominator by conjugate.');
                stepsOp.push('Step 3 (Denominator c² + d²): (' + c2 + ')² + (' + d + ')² = ' + (c2*c2) + ' + ' + (d*d) + ' = <strong>' + den + '</strong>');
                var numRe = (a * c2) + (b * d);
                var numIm = (b * c2) - (a * d);
                stepsOp.push('Step 4 (Numerator Product): (' + a + ' + ' + b + 'i)(' + c2 + ' − ' + d + 'i) = ' + numRe + ' + ' + numIm + 'i');
                var reAns = numRe / den;
                var imAns = numIm / den;
                var reStr = Number.isInteger(reAns) ? reAns : reAns.toFixed(4);
                var imStr = Number.isInteger(imAns) ? imAns : imAns.toFixed(4);
                var resDiv = reStr + ' ' + (imAns >= 0 ? '+' : '-') + ' ' + Math.abs(imAns) + 'i';
                stepsOp.push('Step 5 (Divide components): (' + numRe + ' / ' + den + ') + (' + numIm + ' / ' + den + ')i');
                stepsOp.push('Quotient = <strong>' + resDiv + '</strong>');
                return { result: resDiv, steps: stepsOp.join('\n') };
            }
        }
    }

    return evaluateUniversal(expr);
}

// ================= MAIN EVALUATE WITH FALLBACK =================
function evaluate() {
    var raw = exprInput.value.trim();
    if (!raw) {
        resultDisplay.textContent = '0';
        fallbackMessage.style.display = 'none';
        updateDesktopSidePanel('', '', '');
        return;
    }

    fallbackMessage.style.display = 'none';
    var res, usedFallback = false;

    if (currentBranch === 'universal') res = evaluateUniversal(raw);
    else if (currentBranch === 'arithmetic') res = evaluateArithmetic(raw);
    else if (currentBranch === 'combinatorics') res = evaluateCombinatorics(raw);
    else if (currentBranch === 'logic') res = evaluateLogic(raw);
    else if (currentBranch === 'settheory') res = evaluateSetTheory(raw);
    else if (currentBranch === 'numbertheory') res = evaluateNumberTheory(raw);
    else if (currentBranch === 'conversion') res = evaluateConversion(raw);
    else if (currentBranch === 'matrix') res = evaluateMatrix(raw);
    else if (currentBranch === 'complex') res = evaluateComplex(raw);
    else res = evaluateUniversal(raw);

    if (res.result === 'Error' || (typeof res.result === 'string' && res.result.indexOf('Error') === 0)) {
        if (currentBranch !== 'universal' && currentBranch !== 'arithmetic') {
            var fallbackRes = evaluateUniversal(raw);
            if (fallbackRes.result !== 'Error' && !(typeof fallbackRes.result === 'string' && fallbackRes.result.indexOf('Error') === 0)) {
                usedFallback = true;
                fallbackRes.steps = '<strong>Fallback Notice:</strong> Expression evaluated via Universal Engine.\n\n' + fallbackRes.steps;
                res = fallbackRes;
            }
        }
    }

    var resStr = res.result === undefined ? 'Error' : res.result.toString();
    resultDisplay.textContent = resStr;

    if (typeof res.result === 'number' && isFinite(res.result)) lastAnswer = res.result;

    if (usedFallback) {
        fallbackMessage.textContent = 'Expression evaluated using Universal Engine.';
        fallbackMessage.style.display = 'block';
    }

    addHistory(raw, resStr, res.steps, currentBranch);
    buzz(15);
    showStepsView(raw, resStr, res.steps || 'No detailed steps available for this expression.', true);
}

// ================= UI ACTIONS =================
function toggleDrawer(open) {
    var drawer = document.getElementById('drawer');
    var overlay = document.getElementById('overlay');
    if (drawer) drawer.classList.toggle('open', open);
    if (overlay) overlay.classList.toggle('active', open);
}

function promptResetSession() {
    var modal = document.getElementById('resetConfirmModal');
    if (modal) {
        modal.style.display = 'flex';
    } else if (confirm('Are you sure you want to reset the session? This will restart the app and delete the app\'s data, cache, and your complete history of calculations with OK/Cancel.')) {
        executeResetSession();
    }
}

function closeResetModal() {
    var modal = document.getElementById('resetConfirmModal');
    if (modal) modal.style.display = 'none';
}

function executeResetSession() {
    closeResetModal();
    try {
        localStorage.clear();
    } catch (e) {}
    try {
        sessionStorage.clear();
    } catch (e) {}
    historyEntries = [];
    if ('caches' in window) {
        caches.keys().then(function(names) {
            for (var i = 0; i < names.length; i++) caches.delete(names[i]);
        });
    }
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(regs) {
            for (var i = 0; i < regs.length; i++) regs[i].unregister();
        });
    }
    // Hard refresh with cache-busting timestamp to fully restart the app
    var cleanUrl = window.location.pathname + '?reset=' + Date.now();
    window.location.replace(cleanUrl);
}

// Update modal logic
var updateModal = document.getElementById('updateModal');
var updateNotNowBtn = document.getElementById('updateNotNowBtn');
var updateNowBtn = document.getElementById('updateNowBtn');
var pendingUpdateWorker = null;

function showUpdateModal(message) {
    if (!updateModal) return;
    var msgElem = document.getElementById('updateMessage');
    if (msgElem) msgElem.textContent = message || 'A new offline version is ready. Reload now?';
    updateModal.style.display = 'flex';
}
function hideUpdateModal() { if (updateModal) updateModal.style.display = 'none'; }
function promptForUpdate(worker) { pendingUpdateWorker = worker; showUpdateModal('A new version of the app is ready. Update now?'); }

function setupServiceWorkerUpdates() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(function(registration) {
        setInterval(function() { registration.update(); }, 30 * 60 * 1000);
        if (registration.waiting) promptForUpdate(registration.waiting);
        registration.addEventListener('updatefound', function() {
            var newWorker = registration.installing;
            newWorker.addEventListener('statechange', function() {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) promptForUpdate(newWorker);
            });
        });
    });
    navigator.serviceWorker.addEventListener('controllerchange', function() { window.location.reload(); });
}

function doUpdateNow() {
    if (pendingUpdateWorker) {
        pendingUpdateWorker.postMessage({ action: 'skipWaiting' });
        hideUpdateModal();
    } else {
        window.location.reload(true);
    }
}

// ================= CONTENT PAGES =================
function showHelpPage() {
    var helpHtml = '<div class="about-text">' +
        '<div class="help-guide-intro">' +
            '<h2>HOW TO ENTER MATHEMATICAL &amp; CS EXPRESSIONS</h2>' +
            '<p>Universal CS Calculator accepts standard mathematical notation, programming operators, and specialized Computer Science functions. You can type using your device keyboard or tap the calculator buttons.</p>' +
            '<div class="help-tip-box" style="margin-top:10px; margin-bottom:6px;">' +
                '<div class="help-tip-title">ESSENTIAL INPUT RULES</div>' +
                '<ul style="margin:4px 0 0 16px; padding:0; font-size:0.83rem; line-height:1.6;">' +
                    '<li><strong>Evaluate:</strong> Press <code>=</code> (EVAL) or hit <kbd>Enter</kbd> on your keyboard.</li>' +
                    '<li><strong>Step-by-Step Breakdown:</strong> Tap the large <strong>Result Box</strong> anytime to view every mathematical step, intermediate truth tables, and full proofs.</li>' +
                    '<li><strong>Parentheses:</strong> Always pair opening <code>(</code> with closing <code>)</code>, e.g., <code>(5 + 3) * 4</code>.</li>' +
                    '<li><strong>Function Arguments:</strong> Separate multiple arguments with a comma <code>,</code>, e.g., <code>gcd(120, 45)</code> or <code>nCr(10, 3)</code>.</li>' +
                    '<li><strong>Implicit Multiplication:</strong> Writing <code>2(3+4)</code>, <code>5pi</code>, or <code>4sqrt(16)</code> automatically multiplies.</li>' +
                    '<li><strong>Case-Insensitive:</strong> Operators can be lowercase or uppercase: <code>and</code>, <code>AND</code>, <code>gcd</code>, <code>GCD</code>.</li>' +
                    '<li><strong>Previous Answer:</strong> Use <code>ans</code> to reuse the value from your last calculation.</li>' +
                '</ul>' +
            '</div>' +
        '</div>' +

        // BASIC & SCIENTIFIC ARITHMETIC
        '<div class="help-category-card">' +
            '<div class="help-category-header">' +
                '<div class="help-category-title">Arithmetic &amp; Scientific Operations</div>' +
                '<span class="help-category-badge">Math</span>' +
            '</div>' +
            '<div class="help-item-list">' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Addition &amp; Subtraction</span>' +
                        '<code class="help-code-tag">a + b &nbsp;|&nbsp; a - b</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Standard real number addition and subtraction, including negative numbers.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">145.5 + 234.75</code> <span class="help-result-pill">&rarr; Result: 380.25</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Multiplication &amp; Division</span>' +
                        '<code class="help-code-tag">a * b &nbsp;|&nbsp; a / b</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Supports <code>*</code> or <code>&times;</code> for multiply, and <code>/</code> or <code>&divide;</code> for divide.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">24 * (18 / 3)</code> <span class="help-result-pill">&rarr; Result: 144</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Exponentiation &amp; Powers</span>' +
                        '<code class="help-code-tag">a ^ b &nbsp;|&nbsp; pow(base, exp)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Calculates base raised to the power of exponent.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">2 ^ 10</code> or <code class="help-example-code">pow(2, 10)</code> <span class="help-result-pill">&rarr; Result: 1024</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Modulo (Remainder)</span>' +
                        '<code class="help-code-tag">a % b &nbsp;|&nbsp; a mod b</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Returns integer remainder after division of a by b.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">29 % 6</code> <span class="help-result-pill">&rarr; Result: 5</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Roots (Square &amp; Cube)</span>' +
                        '<code class="help-code-tag">sqrt(x) &nbsp;|&nbsp; cbrt(x)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Computes the square root or cube root of x.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">sqrt(144) + cbrt(27)</code> <span class="help-result-pill">&rarr; Result: 15</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Absolute Value</span>' +
                        '<code class="help-code-tag">abs(x)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Returns the positive magnitude of a number.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">abs(-42)</code> <span class="help-result-pill">&rarr; Result: 42</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Logarithms</span>' +
                        '<code class="help-code-tag">log(x) &nbsp;|&nbsp; ln(x) &nbsp;|&nbsp; log2(x)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Common log (base 10), natural log (base e), and computer science binary log (base 2).</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">log2(256) + log(1000)</code> <span class="help-result-pill">&rarr; Result: 8 + 3 = 11</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Trigonometry</span>' +
                        '<code class="help-code-tag">sin(x), cos(x), tan(x), asin, acos, atan</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Trigonometric and inverse trigonometric functions.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">sin(90)</code> <span class="help-result-pill">&rarr; Result: 1</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Constants</span>' +
                        '<code class="help-code-tag">pi &nbsp;|&nbsp; e</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Standard mathematical constants &pi; (3.14159...) and Euler\'s number e (2.71828...).</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">2 * pi * 5</code> <span class="help-result-pill">&rarr; Result: 31.4159...</span></div>' +
                '</div>' +
            '</div>' +
        '</div>' +

        // BITWISE OPERATORS
        '<div class="help-category-card">' +
            '<div class="help-category-header">' +
                '<div class="help-category-title">Bitwise &amp; Digital Logic</div>' +
                '<span class="help-category-badge">Binary</span>' +
            '</div>' +
            '<div class="help-item-list">' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Bitwise AND</span>' +
                        '<code class="help-code-tag">a &amp; b</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Compares each bit of two numbers; produces 1 if both bits are 1.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">12 &amp; 10</code> (1100 &amp; 1010) <span class="help-result-pill">&rarr; Result: 8 (1000)</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Bitwise OR</span>' +
                        '<code class="help-code-tag">a | b</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Compares each bit; produces 1 if at least one bit is 1.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">12 | 10</code> (1100 | 1010) <span class="help-result-pill">&rarr; Result: 14 (1110)</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Bitwise XOR</span>' +
                        '<code class="help-code-tag">a ^ b &nbsp;|&nbsp; xor(a, b)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Exclusive OR: produces 1 only when bits are different.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">12 ^ 10</code> (1100 ^ 1010) <span class="help-result-pill">&rarr; Result: 6 (0110)</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Bitwise NOT (Inversion)</span>' +
                        '<code class="help-code-tag">~a</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Inverts all bits (one\'s complement).</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">~5</code> <span class="help-result-pill">&rarr; Result: -6</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Bit Shifts (Left &amp; Right)</span>' +
                        '<code class="help-code-tag">a &lt;&lt; b &nbsp;|&nbsp; a &gt;&gt; b</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Shifts bits left (multiplication by 2<sup>b</sup>) or right (division by 2<sup>b</sup>).</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">3 &lt;&lt; 2</code> <span class="help-result-pill">&rarr; Result: 12</span> &nbsp;|&nbsp; <code class="help-example-code">16 &gt;&gt; 2</code> <span class="help-result-pill">&rarr; Result: 4</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Hex &amp; Binary Literals</span>' +
                        '<code class="help-code-tag">0x... &nbsp;|&nbsp; 0b...</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Enter hexadecimal or binary values directly using standard prefixes.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">0xFF + 1</code> <span class="help-result-pill">&rarr; Result: 256</span></div>' +
                '</div>' +
            '</div>' +
        '</div>' +

        // NUMBER SYSTEM CONVERSIONS
        '<div class="help-category-card">' +
            '<div class="help-category-header">' +
                '<div class="help-category-title">Number System Conversions</div>' +
                '<span class="help-category-badge">Radix</span>' +
            '</div>' +
            '<div class="help-item-list">' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Decimal to Binary</span>' +
                        '<code class="help-code-tag">bin(n) &nbsp;|&nbsp; dec2bin(n)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Converts base 10 to base 2 with full repeated division steps.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">bin(255)</code> <span class="help-result-pill">&rarr; Result: 11111111</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Decimal to Hexadecimal</span>' +
                        '<code class="help-code-tag">hex(n) &nbsp;|&nbsp; dec2hex(n)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Converts base 10 to base 16.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">hex(255)</code> <span class="help-result-pill">&rarr; Result: FF</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Decimal to Octal</span>' +
                        '<code class="help-code-tag">oct(n) &nbsp;|&nbsp; dec2oct(n)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Converts base 10 to base 8.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">oct(255)</code> <span class="help-result-pill">&rarr; Result: 377</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Base to Decimal</span>' +
                        '<code class="help-code-tag">bin2dec(x) &nbsp;|&nbsp; hex2dec(x) &nbsp;|&nbsp; oct2dec(x)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Converts binary, hex, or octal string to decimal with place-value polynomials.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">bin2dec(10110101)</code> <span class="help-result-pill">&rarr; Result: 181</span></div>' +
                '</div>' +
            '</div>' +
        '</div>' +

        // NUMBER THEORY & CRYPTOGRAPHY
        '<div class="help-category-card">' +
            '<div class="help-category-header">' +
                '<div class="help-category-title">Number Theory &amp; Cryptography</div>' +
                '<span class="help-category-badge">Algorithms</span>' +
            '</div>' +
            '<div class="help-item-list">' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Greatest Common Divisor</span>' +
                        '<code class="help-code-tag">gcd(a, b)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Computes GCD via Euclidean Algorithm with step-by-step remainder table.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">gcd(120, 45)</code> <span class="help-result-pill">&rarr; Result: 15</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Least Common Multiple</span>' +
                        '<code class="help-code-tag">lcm(a, b)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Computes the smallest positive integer divisible by both a and b.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">lcm(12, 18)</code> <span class="help-result-pill">&rarr; Result: 36</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Primality Test</span>' +
                        '<code class="help-code-tag">prime?(n) &nbsp;|&nbsp; isPrime(n)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Checks whether a positive integer is prime or composite.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">prime?(104729)</code> <span class="help-result-pill">&rarr; Result: TRUE (Prime)</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Prime Factorization</span>' +
                        '<code class="help-code-tag">factor(n)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Decomposes n into its prime factor representation with exponents.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">factor(360)</code> <span class="help-result-pill">&rarr; Result: 2^3 * 3^2 * 5</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Euler\'s Totient Function</span>' +
                        '<code class="help-code-tag">phi(n)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Counts positive integers up to n that are relatively prime to n.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">phi(36)</code> <span class="help-result-pill">&rarr; Result: 12</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Modular Exponentiation</span>' +
                        '<code class="help-code-tag">modpow(base, exp, mod)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Fast (base<sup>exp</sup> mod m) computation used in RSA cryptography.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">modpow(7, 256, 13)</code> <span class="help-result-pill">&rarr; Result: 9</span></div>' +
                '</div>' +
            '</div>' +
        '</div>' +

        // COMBINATORICS
        '<div class="help-category-card">' +
            '<div class="help-category-header">' +
                '<div class="help-category-title">Combinatorics &amp; Counting</div>' +
                '<span class="help-category-badge">Discrete</span>' +
            '</div>' +
            '<div class="help-item-list">' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Combinations (n Choose r)</span>' +
                        '<code class="help-code-tag">nCr(n, r)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Calculates n! / (r! &times; (n - r)!). Order does not matter.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">nCr(10, 3)</code> <span class="help-result-pill">&rarr; Result: 120</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Permutations</span>' +
                        '<code class="help-code-tag">nPr(n, r)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Calculates n! / (n - r)!. Order matters.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">nPr(8, 4)</code> <span class="help-result-pill">&rarr; Result: 1680</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Factorial</span>' +
                        '<code class="help-code-tag">n! &nbsp;|&nbsp; fact(n)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Product of all positive integers less than or equal to n.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">6!</code> <span class="help-result-pill">&rarr; Result: 720</span></div>' +
                '</div>' +
            '</div>' +
        '</div>' +

        // PROPOSITIONAL LOGIC
        '<div class="help-category-card">' +
            '<div class="help-category-header">' +
                '<div class="help-category-title">Propositional Logic &amp; Truth Tables</div>' +
                '<span class="help-category-badge">Logic</span>' +
            '</div>' +
            '<div class="help-item-list">' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Boolean Values</span>' +
                        '<code class="help-code-tag">TRUE &nbsp;|&nbsp; FALSE</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Represents truth values. 1 and 0 are also accepted.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">TRUE AND FALSE</code> <span class="help-result-pill">&rarr; Result: FALSE</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Logical AND, OR, NOT</span>' +
                        '<code class="help-code-tag">AND, OR, NOT &nbsp;|&nbsp; &amp;&amp;, ||, !</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Standard logical connectives with operator precedence.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">(TRUE OR FALSE) AND NOT FALSE</code> <span class="help-result-pill">&rarr; Result: TRUE</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Implication (Conditional)</span>' +
                        '<code class="help-code-tag">P IMPLIES Q &nbsp;|&nbsp; P -&gt; Q</code>' +
                    '</div>' +
                    '<p class="help-item-desc">False only when premise P is true and conclusion Q is false.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">TRUE IMPLIES FALSE</code> <span class="help-result-pill">&rarr; Result: FALSE</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Equivalence (Biconditional)</span>' +
                        '<code class="help-code-tag">P EQUIV Q &nbsp;|&nbsp; P &lt;-&gt; Q</code>' +
                    '</div>' +
                    '<p class="help-item-desc">True when both operands have identical truth values.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">FALSE EQUIV FALSE</code> <span class="help-result-pill">&rarr; Result: TRUE</span></div>' +
                '</div>' +
            '</div>' +
        '</div>' +

        // SET THEORY
        '<div class="help-category-card">' +
            '<div class="help-category-header">' +
                '<div class="help-category-title">Set Theory Operations</div>' +
                '<span class="help-category-badge">Sets</span>' +
            '</div>' +
            '<div class="help-item-list">' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Set Notation</span>' +
                        '<code class="help-code-tag">{1, 2, 3}</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Sets are written inside curly braces with comma-separated elements.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">{1, 2, 3}</code></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Set Union</span>' +
                        '<code class="help-code-tag">A UNION B &nbsp;|&nbsp; A &cup; B</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Combines elements from both sets with duplicate values removed.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">{1, 2, 3} UNION {3, 4, 5}</code> <span class="help-result-pill">&rarr; Result: {1, 2, 3, 4, 5}</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Set Intersection</span>' +
                        '<code class="help-code-tag">A INTERSECT B &nbsp;|&nbsp; A &cap; B</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Finds elements common to both sets.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">{1, 2, 3} INTERSECT {2, 3, 4}</code> <span class="help-result-pill">&rarr; Result: {2, 3}</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Set Difference</span>' +
                        '<code class="help-code-tag">A DIFF B &nbsp;|&nbsp; A \\ B</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Elements in A that are not in B.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">{1, 2, 3} DIFF {2}</code> <span class="help-result-pill">&rarr; Result: {1, 3}</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Symmetric Difference</span>' +
                        '<code class="help-code-tag">A SYMDIFF B</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Elements in either set, but not in both.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">{1, 2, 3} SYMDIFF {2, 3, 4}</code> <span class="help-result-pill">&rarr; Result: {1, 4}</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Subset Verification</span>' +
                        '<code class="help-code-tag">SUBSET(A, B)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Checks if set A is a subset of set B.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">SUBSET({1, 2}, {1, 2, 3})</code> <span class="help-result-pill">&rarr; Result: TRUE</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Power Set &amp; Cardinality</span>' +
                        '<code class="help-code-tag">POWERSET(A) &nbsp;|&nbsp; card(A)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Generates all subsets (2<sup>|A|</sup> elements) or measures set size.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">card({1, 2, 3, 4})</code> <span class="help-result-pill">&rarr; Result: 4</span></div>' +
                '</div>' +
            '</div>' +
        '</div>' +

        // MATRIX 2x2
        '<div class="help-category-card">' +
            '<div class="help-category-header">' +
                '<div class="help-category-title">Matrix Algebra (2&times;2)</div>' +
                '<span class="help-category-badge">Linear Algebra</span>' +
            '</div>' +
            '<div class="help-item-list">' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Matrix Format</span>' +
                        '<code class="help-code-tag">(a, b, c, d)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Entered as 4 comma-separated values representing row 1 [a, b] and row 2 [c, d].</p>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Determinant</span>' +
                        '<code class="help-code-tag">det2x2(a, b, c, d)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Calculates ad - bc with explicit multiplication steps.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">det2x2(1, 2, 3, 4)</code> <span class="help-result-pill">&rarr; Result: 1*4 - 2*3 = -2</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Inverse Matrix</span>' +
                        '<code class="help-code-tag">inv2x2(a, b, c, d)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Computes 1/det &times; [d, -b; -c, a].</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">inv2x2(1, 2, 3, 4)</code> <span class="help-result-pill">&rarr; Result: [-2, 1; 1.5, -0.5]</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Matrix Multiplication</span>' +
                        '<code class="help-code-tag">mul2x2(a1, b1, c1, d1, a2, b2, c2, d2)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Multiplies two 2&times;2 matrices with dot-product steps.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">mul2x2(1,2,3,4, 2,0,1,2)</code> <span class="help-result-pill">&rarr; Result: [4, 4; 10, 8]</span></div>' +
                '</div>' +
            '</div>' +
        '</div>' +

        // COMPLEX NUMBERS
        '<div class="help-category-card">' +
            '<div class="help-category-header">' +
                '<div class="help-category-title">Complex Numbers</div>' +
                '<span class="help-category-badge">Complex</span>' +
            '</div>' +
            '<div class="help-item-list">' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Complex Representation</span>' +
                        '<code class="help-code-tag">a + bi &nbsp;|&nbsp; a - bi</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Write complex expressions with standard imaginary unit <code>i</code>.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">(3 + 4i) + (2 - 5i)</code> <span class="help-result-pill">&rarr; Result: 5 - 1i</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Real &amp; Imaginary Parts</span>' +
                        '<code class="help-code-tag">re(z) &nbsp;|&nbsp; im(z)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Extracts the real component or imaginary coefficient.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">re(3 + 4i)</code> <span class="help-result-pill">&rarr; 3</span> &nbsp;|&nbsp; <code class="help-example-code">im(3 + 4i)</code> <span class="help-result-pill">&rarr; 4</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Conjugate &amp; Modulus</span>' +
                        '<code class="help-code-tag">conj(z) &nbsp;|&nbsp; abs(z)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Computes complex conjugate (a - bi) and absolute magnitude &radic;(a<sup>2</sup> + b<sup>2</sup>).</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">abs(3 + 4i)</code> <span class="help-result-pill">&rarr; Result: 5</span></div>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Argument &amp; Polar Form</span>' +
                        '<code class="help-code-tag">arg(z) &nbsp;|&nbsp; polar(z)</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Computes phase angle &theta; in degrees/radians or polar magnitude.</p>' +
                    '<div class="help-item-example">Example: <code class="help-example-code">polar(3 + 4i)</code> <span class="help-result-pill">&rarr; Result: 5 &ang; 53.13&deg;</span></div>' +
                '</div>' +
            '</div>' +
        '</div>' +

        // CODE TRACER & DSA
        '<div class="help-category-card">' +
            '<div class="help-category-header">' +
                '<div class="help-category-title">Code Tracer &amp; DSA Visualizer</div>' +
                '<span class="help-category-badge">Algorithms</span>' +
            '</div>' +
            '<div class="help-item-list">' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">How to Access</span>' +
                        '<code class="help-code-tag">Drawer &rarr; Code Tracer &amp; DSA</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Open the side drawer menu and select <strong>Code Tracer &amp; DSA</strong> to switch into the interactive algorithm studio.</p>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Supported Languages</span>' +
                        '<code class="help-code-tag">Python &bull; C++ &bull; Java &bull; JS &bull; C &bull; Rust</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Select your desired language, choose from curated DSA presets (Binary Search, Two Sum, Bubble Sort, Kadane\'s, Recursion, etc.), or type your own algorithm.</p>' +
                '</div>' +
                '<div class="help-item-row">' +
                    '<div class="help-item-top">' +
                        '<span class="help-item-name">Execution &amp; Visual Tabs</span>' +
                        '<code class="help-code-tag">Trace &amp; Execute Code</code>' +
                    '</div>' +
                    '<p class="help-item-desc">Use the step-by-step playback scrubber, play/pause controls, and inspect the <strong>Narrative</strong>, <strong>Variable Matrix</strong>, <strong>DSA Array &amp; Pointer Visualizer</strong>, and <strong>Call Stack</strong> at each line.</p>' +
                '</div>' +
            '</div>' +
        '</div>' +

        // COMMON MISTAKES & HOW TO FIX THEM
        '<div class="help-tip-box warning-tip" style="margin-top:16px;">' +
            '<div class="help-tip-title">HOW TO AVOID COMMON INPUT ERRORS</div>' +
            '<ul style="margin:6px 0 0 16px; padding:0; font-size:0.83rem; line-height:1.6;">' +
                '<li><strong>Unbalanced Brackets:</strong> Typing <code>(5 + 3 * 2</code> will trigger a syntax notice. Always ensure every open <code>(</code> or <code>{</code> has a closing <code>)</code> or <code>}</code>.</li>' +
                '<li><strong>Missing Function Commas:</strong> Entering <code>gcd(120 45)</code> fails because the arguments blend together. Always place a comma between parameters: <code>gcd(120, 45)</code>.</li>' +
                '<li><strong>Division by Zero:</strong> Expressions like <code>10 / 0</code> or <code>15 % 0</code> are mathematically undefined and will indicate division by zero.</li>' +
                '<li><strong>Radix Bounds:</strong> In binary conversions (<code>bin2dec</code>), only digits <code>0</code> and <code>1</code> are valid. For hexadecimal (<code>hex2dec</code>), valid characters are <code>0-9</code> and <code>A-F</code>.</li>' +
            '</ul>' +
        '</div>' +

        '</div>';
    showFullPage('HELP / HOW TO USE', helpHtml);
}

function showPrivacyPage() {
    var privacyHtml = '<div class="about-text">' +
        '<div style="text-align:center; margin-bottom:16px;">' +
        '<img src="app-icon.png" alt="App Logo" width="64" height="64" style="border-radius:14px; box-shadow:0 0 16px rgba(124,58,237,0.5);">' +
        '</div>' +
        '<h2>PRIVACY POLICY</h2>' +
        '<p class="muted-small">Last updated: May 2026</p>' +
        '<h3>1. Introduction</h3>' +
        '<p>This privacy policy applies to the Universal CS Calculator application developed by Hanz Dalmino.</p>' +
        '<h3>2. Data Collection</h3>' +
        '<p>We do not collect any personal data. Calculations, history, and preferences are stored locally on your device and never transmitted anywhere.</p>' +
        '<h3>3. Information Stored Locally</h3>' +
        '<ul>' +
        '<li>Calculation history</li>' +
        '<li>Theme preference</li>' +
        '<li>Font preference</li>' +
        '</ul>' +
        '<p>Reset or erase all stored data anytime via "Reset Session" in the navigation drawer.</p>' +
        '<h3>4. Third-Party Services</h3>' +
        '<p>No analytics, advertising, or tracking services are used.</p>' +
        '<h3>5. Internet Usage</h3>' +
        '<p>The app works fully offline after the first visit.</p>' +
        '<h3>6. Children\'s Privacy</h3>' +
        '<p>No personal information is collected from anyone, including children under 13.</p>' +
        '<h3>7. Changes to This Policy</h3>' +
        '<p>Updates will be reflected on this page.</p>' +
        '<h3>8. Contact</h3>' +
        '<p>Email: <a href="mailto:dalminohanz14@gmail.com" style="color:var(--accent);">dalminohanz14@gmail.com</a></p>' +
        '</div>';
    showFullPage('PRIVACY POLICY', privacyHtml);
}

function showAboutPage() {
    var aboutHtml = '<div class="about-text">' +
        '<div style="text-align:center; margin-bottom:16px;">' +
        '<img src="app-icon.png" alt="App Logo" width="72" height="72" style="border-radius:16px; box-shadow:0 0 20px rgba(124,58,237,0.6);">' +
        '</div>' +
        '<h2>ABOUT</h2>' +
        '<p><strong>Developed by Hanz Dalmino</strong></p>' +
        '<p>A Bachelor of Science in Information Technology student from Cebu Technological University - Main Campus</p>' +
        '<h3>Purpose</h3>' +
        '<p>This Universal CS Calculator is designed for students and professionals in Computer Science, Information Technology, Computer Engineering, and related fields, offering step-by-step evaluation across key disciplines.</p>' +
        '<h3>Topics Covered</h3>' +
        '<ul>' +
        '<li>Arithmetic &amp; Bitwise Operations</li>' +
        '<li>Relational and Logical Operators</li>' +
        '<li>Combinatorics (nCr, nPr, Factorials)</li>' +
        '<li>Boolean Algebra and Logic Gates</li>' +
        '<li>Set Theory</li>' +
        '<li>Number Theory (GCD, LCM, Modulo, Primality, Factoring)</li>' +
        '<li>Number System Conversions</li>' +
        '<li>Matrix Algebra (2×2)</li>' +
        '<li>Complex Numbers</li>' +
        '<li>Scientific Functions</li>' +
        '</ul>' +
        '<h3>Why This Calculator?</h3>' +
        '<p>It shows every step of the evaluation to help students understand the process, and handles mixed arithmetic, bitwise, relational, and logical expressions in one line — fully customizable with 12 themes and multiple fonts, on desktop, tablet, and mobile.</p>' +
        '</div>';
    showFullPage('ABOUT', aboutHtml);
}

function showThemesPage() {
    var html = '<div class="theme-grid">';
    for (var i = 0; i < themes.length; i++) {
        html += '<div class="theme-card" data-theme="' + themes[i] + '" style="--swatch:' + getThemeColor(themes[i]) + '">' +
                '<span class="theme-swatch"></span>' + themeNames[i] + '</div>';
    }
    html += '</div>';
    showFullPage('THEMES (12)', html);

    var cards = document.querySelectorAll('.theme-card');
    for (var i = 0; i < cards.length; i++) {
        cards[i].addEventListener('click', function() {
            applyTheme(this.dataset.theme);
            showCalculatorView();
        });
    }
}

function showFontPage() {
    var fonts = [
        { label: 'Inter Sans (Default)', value: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" },
        { label: 'JetBrains Mono (Developer)', value: "'JetBrains Mono', 'Courier New', monospace" },
        { label: 'Times New Roman (Academic)', value: 'Times New Roman, serif' },
        { label: 'Arial (Clean)', value: 'Arial, sans-serif' },
        { label: 'Georgia (Editorial)', value: 'Georgia, serif' },
        { label: 'Verdana (Accessible)', value: 'Verdana, sans-serif' }
    ];
    var html = '<div class="font-selector-page">';
    for (var i = 0; i < fonts.length; i++) {
        html += '<div class="font-option" data-font="' + fonts[i].value + '" style="font-family:' + fonts[i].value + '">' + fonts[i].label + '</div>';
    }
    html += '</div>';
    showFullPage('TYPOGRAPHY & FONTS', html);

    var opts = document.querySelectorAll('.font-option');
    for (var i = 0; i < opts.length; i++) {
        opts[i].addEventListener('click', function() {
            setFont(this.dataset.font);
            showCalculatorView();
        });
    }
}

function showHistoryPage() {
    if (historyEntries.length === 0) {
        showFullPage('CALCULATION HISTORY', '<div class="history-item-page">No calculations recorded yet.</div>');
        return;
    }
    var html = '<div class="history-list-page">';
    for (var i = 0; i < historyEntries.length; i++) {
        var h = historyEntries[i];
        html += '<div class="history-item-page" data-index="' + i + '">' +
                '<div class="history-expr">' + escapeHtml(h.expr) + '</div>' +
                '<div class="history-result">= ' + escapeHtml(h.result) + '</div>' +
                '<div class="history-meta">' + escapeHtml(branchNames[h.branch] || h.branch) + ' · ' + escapeHtml(h.date) + '</div>' +
                '</div>';
    }
    html += '</div><button id="clearHistoryFromPage" class="action-btn danger-btn full-width-btn">CLEAR ALL HISTORY</button>';
    showFullPage('CALCULATION HISTORY', html);

    var items = document.querySelectorAll('.history-item-page[data-index]');
    for (var i = 0; i < items.length; i++) {
        items[i].addEventListener('click', function() {
            var idx = parseInt(this.getAttribute('data-index'), 10);
            var h = historyEntries[idx];
            exprInput.value = h.expr;
            switchBranch(h.branch);
            showCalculatorView();
            evaluate();
            exprInput.focus();
        });
    }
    var clearBtn = document.getElementById('clearHistoryFromPage');
    if (clearBtn) clearBtn.addEventListener('click', function() { clearHistory(); showHistoryPage(); });
}

function getThemeColor(t) {
    var c = {
        default: '#7c3aed', obsidian: '#a855f7', royalblue: '#2563eb', orange: '#ea580c',
        highcontrast: '#facc15', forest: '#16a34a', crimson: '#e11d48', slate: '#475569',
        purple: '#9333ea', midnight: '#4f46e5', sand: '#d97706', 'cyan-night': '#0891b2'
    };
    return c[t] || '#7c3aed';
}

// ================= KEYBOARD SUPPORT =================
function handlePhysicalKeydown(e) {
    if (e.key === 'Enter') { e.preventDefault(); evaluate(); return; }
    if (e.key === 'Escape') {
        exprInput.value = '';
        resultDisplay.textContent = '0';
        if (fallbackMessage) fallbackMessage.style.display = 'none';
        updateDesktopSidePanel('', '', '');
        return;
    }
}

// ================= MARVEL SPLASH SCREEN =================
function initSplashScreen() {
    var splash = document.getElementById('splashScreen');
    if (!splash) return;

    var isDismissed = false;

    function dismiss() {
        if (isDismissed) return;
        isDismissed = true;
        splash.classList.add('fade-out');
        setTimeout(function() {
            if (splash) {
                splash.style.display = 'none';
            }
        }, 520);
    }

    // Displays iconic HDDev Marvel intro with slower, cinematic pacing and smoothly fades out
    splash.addEventListener('click', dismiss);
    setTimeout(function() {
        dismiss();
    }, 5600);
}

// ================= INITIALIZATION =================
function init() {
    initSplashScreen();
    loadHistory();
    initTheme();
    initFont();
    initKeyboardState();
    updateBranchIndicator();
    renderButtons();

    // Steps view buttons and result box
    var resultBox = document.getElementById('resultBox');
    if (resultBox) {
        resultBox.addEventListener('click', function() {
            buzz();
            openStepsView();
        });
    }

    var viewStepsBtn = document.getElementById('viewStepsBtn');
    if (viewStepsBtn) {
        viewStepsBtn.addEventListener('click', function() {
            buzz();
            openStepsView();
        });
    }

    // Drawer branch buttons
    var branchBtns = document.querySelectorAll('.branch-drawer-btn');
    for (var i = 0; i < branchBtns.length; i++) {
        branchBtns[i].addEventListener('click', function() {
            var branch = this.getAttribute('data-branch');
            switchBranch(branch);
            toggleDrawer(false);
        });
    }

    // Desktop mode tabs
    var modeTabs = document.querySelectorAll('.mode-tab-btn');
    for (var k = 0; k < modeTabs.length; k++) {
        modeTabs[k].addEventListener('click', function() {
            var branch = this.getAttribute('data-branch');
            switchBranch(branch);
        });
    }

    // Drawer content links
    var drawerHelpBtn = document.getElementById('drawerHelpBtn');
    if (drawerHelpBtn) drawerHelpBtn.onclick = function() { toggleDrawer(false); showHelpPage(); };
    var drawerPrivacyBtn = document.getElementById('drawerPrivacyBtn');
    if (drawerPrivacyBtn) drawerPrivacyBtn.onclick = function() { toggleDrawer(false); showPrivacyPage(); };
    var drawerThemesBtn = document.getElementById('drawerThemesBtn');
    if (drawerThemesBtn) drawerThemesBtn.onclick = function() { toggleDrawer(false); showThemesPage(); };
    var drawerFontBtn = document.getElementById('drawerFontBtn');
    if (drawerFontBtn) drawerFontBtn.onclick = function() { toggleDrawer(false); showFontPage(); };
    var drawerHistoryBtn = document.getElementById('drawerHistoryBtn');
    if (drawerHistoryBtn) drawerHistoryBtn.onclick = function() { toggleDrawer(false); showHistoryPage(); };
    var drawerAboutBtn = document.getElementById('drawerAboutBtn');
    if (drawerAboutBtn) drawerAboutBtn.onclick = function() { toggleDrawer(false); showAboutPage(); };
    var drawerClearCacheBtn = document.getElementById('drawerClearCacheBtn');
    if (drawerClearCacheBtn) drawerClearCacheBtn.onclick = function() { toggleDrawer(false); promptResetSession(); };
    var drawerExitBtn = document.getElementById('drawerExitBtn');
    if (drawerExitBtn) drawerExitBtn.onclick = function() { toggleDrawer(false); promptResetSession(); };

    // Reset Confirmation Modal buttons
    var resetCancelBtn = document.getElementById('resetCancelBtn');
    if (resetCancelBtn) resetCancelBtn.onclick = closeResetModal;
    var resetModalOverlay = document.getElementById('resetModalOverlay');
    if (resetModalOverlay) resetModalOverlay.onclick = closeResetModal;
    var resetConfirmBtn = document.getElementById('resetConfirmBtn');
    if (resetConfirmBtn) resetConfirmBtn.onclick = executeResetSession;

    // Action buttons
    document.getElementById('equalBtn').onclick = evaluate;
    document.getElementById('clearBtn').onclick = function() {
        buzz();
        exprInput.value = '';
        resultDisplay.textContent = '0';
        if (fallbackMessage) fallbackMessage.style.display = 'none';
        exprInput.focus();
    };

    var inputClearBtn = document.getElementById('inputClearBtn') || document.getElementById('inputClearMiniBtn');
    if (inputClearBtn) {
        inputClearBtn.onclick = function() {
            buzz();
            exprInput.value = '';
            resultDisplay.textContent = '0';
            if (fallbackMessage) fallbackMessage.style.display = 'none';
            exprInput.focus();
        };
    }

    document.getElementById('leftBtn').onclick = function() { buzz(); moveCaret(-1); };
    document.getElementById('rightBtn').onclick = function() { buzz(); moveCaret(1); };
    document.getElementById('backBtn').onclick = function() { buzz(); backspaceAtCaret(); };
    document.getElementById('ansToggleBtn').onclick = function() { buzz(); insertAtCaret('ANS'); showToast('Inserted last answer (' + lastAnswer + ')'); };

    // View controls
    document.getElementById('menuToggleBtn').onclick = function() { toggleDrawer(true); };
    document.getElementById('closeDrawerBtn').onclick = function() { toggleDrawer(false); };
    document.getElementById('overlay').onclick = function() { toggleDrawer(false); };
    document.getElementById('closeFullPageBtn').onclick = function() { showCalculatorView(); };
    document.getElementById('backToCalculatorBtn').onclick = function() { showCalculatorView(); };

    if (codeTracerToggleBtn) {
        codeTracerToggleBtn.onclick = function() {
            buzz();
            toggleCodeTracerView();
        };
    }

    if (drawerCodeTracerBtn) {
        drawerCodeTracerBtn.onclick = function() {
            buzz();
            toggleDrawer(false);
            showCodeTracerView();
        };
    }

    if (window.initCodeTracer) {
        window.initCodeTracer();
    }

    var copyStepsBtn = document.getElementById('copyStepsBtn');
    if (copyStepsBtn) copyStepsBtn.onclick = copyStepsToClipboard;

    document.getElementById('keyboardToggleBtn').onclick = function() {
        buzz();
        toggleKeyboard();
    };

    if (updateNotNowBtn) updateNotNowBtn.onclick = function() { hideUpdateModal(); };
    if (updateNowBtn) updateNowBtn.onclick = function() { doUpdateNow(); };

    initPwaWelcomeModal();

    window.addEventListener('keydown', handlePhysicalKeydown);

    setupServiceWorkerUpdates();

    // Register service worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('./sw.js')
                .then(function(reg) {
                    console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
                })
                .catch(function(err) {
                    console.warn('[PWA] ServiceWorker registration failed:', err);
                });
        });
    }
}

init();
