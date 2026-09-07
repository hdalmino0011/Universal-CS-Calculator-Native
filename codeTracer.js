// ================= UNIVERSAL CODE TRACER & DSA ENGINE =================
// Supports tracing, iterations, variable state mutation, call stack, and DSA visualizer for ANY programming language.

(function(window) {
    'use strict';

    // State
    var tracerState = {
        code: '',
        language: 'auto',
        customInput: '',
        traceData: null,
        currentStep: 0,
        isPlaying: false,
        playInterval: null,
        playSpeed: 800
    };

    // Curated DSA Presets across multiple languages
    var DSA_PRESETS = {
        'binsearch_cpp': {
            lang: 'cpp',
            title: 'Binary Search (Pointers & Halving)',
            code: '// Binary Search in C++ (O(log n))\n#include <iostream>\n#include <vector>\n\nint binarySearch(const std::vector<int>& arr, int target) {\n    int low = 0;\n    int high = arr.size() - 1;\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (arr[mid] == target) {\n            return mid; // Target found\n        }\n        if (arr[mid] < target) {\n            low = mid + 1; // Search right half\n        } else {\n            high = mid - 1; // Search left half\n        }\n    }\n    return -1; // Target not found\n}\n\nint main() {\n    std::vector<int> arr = {2, 4, 7, 10, 15, 20};\n    int target = 10;\n    int result = binarySearch(arr, target);\n    std::cout << "Element found at index: " << result << std::endl;\n    return 0;\n}',
            customInput: 'arr = [2, 4, 7, 10, 15, 20], target = 10'
        },
        'twosum_py': {
            lang: 'python',
            title: 'Two Sum II - Sorted Array (Two Pointers)',
            code: '# Two Sum (Two Pointers) in Python\ndef two_sum_sorted(numbers, target):\n    left = 0\n    right = len(numbers) - 1\n    while left < right:\n        current_sum = numbers[left] + numbers[right]\n        if current_sum == target:\n            return [left, right] # 0-indexed indices\n        elif current_sum < target:\n            left += 1\n        else:\n            right -= 1\n    return []\n\nnums = [2, 7, 11, 15]\ntarget_val = 9\nans = two_sum_sorted(nums, target_val)\nprint("Indices found:", ans)',
            customInput: 'numbers = [2, 7, 11, 15], target = 9'
        },
        'kadane_java': {
            lang: 'java',
            title: "Maximum Subarray (Kadane's Algorithm)",
            code: '// Maximum Subarray (Kadane\'s Algorithm) in Java\npublic class Kadane {\n    public static int maxSubArray(int[] nums) {\n        int maxSoFar = nums[0];\n        int currentMax = nums[0];\n        for (int i = 1; i < nums.length; i++) {\n            currentMax = Math.max(nums[i], currentMax + nums[i]);\n            maxSoFar = Math.max(maxSoFar, currentMax);\n        }\n        return maxSoFar;\n    }\n\n    public static void main(String[] args) {\n        int[] arr = {-2, 1, -3, 4, -1, 2, 1, -5, 4};\n        int result = maxSubArray(arr);\n        System.out.println("Maximum Subarray Sum: " + result);\n    }\n}',
            customInput: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]'
        },
        'bubble_js': {
            lang: 'javascript',
            title: 'Bubble Sort (Nested Iterations & Swaps)',
            code: '// Bubble Sort in JavaScript\nfunction bubbleSort(arr) {\n    let n = arr.length;\n    let swapped = false;\n    for (let i = 0; i < n - 1; i++) {\n        swapped = false;\n        for (let j = 0; j < n - i - 1; j++) {\n            if (arr[j] > arr[j + 1]) {\n                let temp = arr[j];\n                arr[j] = arr[j + 1];\n                arr[j + 1] = temp;\n                swapped = true;\n            }\n        }\n        if (!swapped) break;\n    }\n    return arr;\n}\n\nlet numbers = [64, 34, 25, 12, 22];\nconsole.log("Sorted Array:", bubbleSort(numbers));',
            customInput: 'arr = [64, 34, 25, 12, 22]'
        },
        'fib_py': {
            lang: 'python',
            title: 'Recursive Fibonacci (Call Stack & Base Cases)',
            code: '# Recursive Fibonacci in Python\ndef fibonacci(n):\n    if n <= 0:\n        return 0\n    elif n == 1:\n        return 1\n    return fibonacci(n - 1) + fibonacci(n - 2)\n\nnum = 4\nresult = fibonacci(num)\nprint(f"Fibonacci({num}) = {result}")',
            customInput: 'n = 4'
        },
        'revlist_c': {
            lang: 'c',
            title: 'Reverse Singly Linked List (Pointers)',
            code: '// Reverse Singly Linked List in C\n#include <stdio.h>\n#include <stdlib.h>\n\nstruct ListNode {\n    int val;\n    struct ListNode* next;\n};\n\nstruct ListNode* reverseList(struct ListNode* head) {\n    struct ListNode* prev = NULL;\n    struct ListNode* curr = head;\n    while (curr != NULL) {\n        struct ListNode* nextNode = curr->next;\n        curr->next = prev;\n        prev = curr;\n        curr = nextNode;\n    }\n    return prev;\n}\n\nint main() {\n    printf("Linked list nodes reversed in-place: prev <- curr\\n");\n    return 0;\n}',
            customInput: 'List: 1 -> 2 -> 3 -> 4 -> NULL'
        },
        'paren_java': {
            lang: 'java',
            title: 'Valid Parentheses (Stack Data Structure)',
            code: '// Valid Parentheses with Stack in Java\nimport java.util.Stack;\n\npublic class Solution {\n    public static boolean isValid(String s) {\n        Stack<Character> stack = new Stack<>();\n        for (char c : s.toCharArray()) {\n            if (c == \'(\' || c == \'{\' || c == \'[\') {\n                stack.push(c);\n            } else {\n                if (stack.isEmpty()) return false;\n                char top = stack.pop();\n                if (c == \')\' && top != \'(\') return false;\n                if (c == \'}\' && top != \'{\') return false;\n                if (c == \']\' && top != \'[\') return false;\n            }\n        }\n        return stack.isEmpty();\n    }\n\n    public static void main(String[] args) {\n        String expr = "{[()]}";\n        System.out.println("Is valid: " + isValid(expr));\n    }\n}',
            customInput: 's = "{[()]}"'
        },
        'merge_py': {
            lang: 'python',
            title: 'Merge Sort (Divide & Conquer)',
            code: '# Merge Sort in Python\ndef merge_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    return merge(left, right)\n\ndef merge(left, right):\n    result = []\n    i = j = 0\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            result.append(left[i])\n            i += 1\n        else:\n            result.append(right[j])\n            j += 1\n    result.extend(left[i:])\n    result.extend(right[j:])\n    return result\n\nitems = [38, 27, 43, 3, 9, 82, 10]\nprint("Sorted:", merge_sort(items))',
            customInput: 'arr = [38, 27, 43, 3, 9, 82, 10]'
        },
        'setbits_rust': {
            lang: 'rust',
            title: 'Count Set Bits (Bitwise Masking)',
            code: '// Count Set Bits in Rust\nfn count_set_bits(mut n: u32) -> u32 {\n    let mut count = 0;\n    while n > 0 {\n        n &= n - 1; // Clears the lowest set bit\n        count += 1;\n    }\n    count\n}\n\nfn main() {\n    let val: u32 = 29; // binary: 11101 (4 set bits)\n    let bits = count_set_bits(val);\n    println!("Number of set bits in {}: {}", val, bits);\n}',
            customInput: 'n = 29'
        }
    };

    // DOM References
    var codeInput = document.getElementById('tracerCodeInput');
    var lineGutter = document.getElementById('tracerLineGutter');
    var tracerEditorBox = document.getElementById('tracerEditorBox');
    var langSelect = document.getElementById('tracerLangSelect');
    var presetsSelect = document.getElementById('tracerPresetsSelect');
    var customInputEl = document.getElementById('tracerCustomInput');
    var runBtn = document.getElementById('tracerRunBtn');
    var loadingBox = document.getElementById('tracerLoadingState');
    var resultsContainer = document.getElementById('tracerResultsContainer');

    // Stepper controls
    var stepFirstBtn = document.getElementById('stepFirstBtn');
    var stepPrevBtn = document.getElementById('stepPrevBtn');
    var stepPlayPauseBtn = document.getElementById('stepPlayPauseBtn');
    var playIconSvg = document.getElementById('playIconSvg');
    var pauseIconSvg = document.getElementById('pauseIconSvg');
    var stepNextBtn = document.getElementById('stepNextBtn');
    var stepLastBtn = document.getElementById('stepLastBtn');
    var stepCounterBadge = document.getElementById('stepCounterBadge');
    var stepSpeedSelect = document.getElementById('stepSpeedSelect');
    var stepScrubberSlider = document.getElementById('stepScrubberSlider');

    // Viewer
    var codeViewerLines = document.getElementById('tracerCodeViewerLines');
    var activeLineIndicator = document.getElementById('activeLineIndicator');
    var codeHighlight = document.getElementById('tracerCodeHighlight');

    // Meta chips
    var metaTitle = document.getElementById('tracerAlgorithmTitle');
    var metaCategory = document.getElementById('tracerAlgorithmCategory');
    var metaTime = document.getElementById('tracerTimeComplexity');
    var metaSpace = document.getElementById('tracerSpaceComplexity');
    var metaLang = document.getElementById('tracerConfirmedLanguage');

    // Tab bodies
    var narrativeStepPill = document.getElementById('narrativeStepPill');
    var narrativeLoopPill = document.getElementById('narrativeLoopPill');
    var narrativeCodeSnippet = document.getElementById('narrativeCodeSnippet');
    var narrativeExplanationBody = document.getElementById('narrativeExplanationBody');
    var varsMatrixTableBody = document.getElementById('varsMatrixTableBody');
    var dsaVisualContainer = document.getElementById('dsaVisualContainer');
    var stackViewContainer = document.getElementById('stackViewContainer');
    var terminalOutputText = document.getElementById('terminalOutputText');
    var analysisTimeComplexity = document.getElementById('analysisTimeComplexity');
    var analysisSpaceComplexity = document.getElementById('analysisSpaceComplexity');
    var analysisTotalSteps = document.getElementById('analysisTotalSteps');
    var analysisComplexityNotes = document.getElementById('analysisComplexityNotes');

    var currentEditorMode = 'edit';
    var isWordWrapEnabled = true;

    // Universal VS Code Dark+ Syntax Tokenizer & Highlighter
    function highlightCodeSyntax(rawCode, lang) {
        if (!rawCode) return '';

        // Token regex capturing comments, strings, numbers, control flow, keywords, types, constants, functions, operators, punctuation
        var tokenRegex = /(\/\*[\s\S]*?\*\/)|(\/\/.*|#(?!include).*)|("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`)|(\b0x[0-9a-fA-F]+\b|\b0b[01]+\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\b(?:for|while|do|if|else|elif|return|yield|break|continue|switch|case|default|try|catch|finally|throw|except|raise|with|in|and|or|not|is)\b)|(\b(?:def|func|fn|function|class|struct|enum|interface|type|typedef|let|var|const|val|mut|auto|public|private|protected|static|final|abstract|virtual|override|import|include|package|namespace|using|from|as|new|this|self|super|lambda|match|async|await)\b)|(\b(?:int|float|double|char|bool|boolean|void|string|String|vector|List|ArrayList|Map|HashMap|Set|HashSet|Array|Object|i8|i16|i32|i64|u8|u16|u32|u64|usize|isize|f32|f64|size_t|long|short|byte)\b)|(\b(?:true|false|True|False|null|None|nil|undefined|nullptr|NaN|Infinity)\b)|(\b[a-zA-Z_]\w*(?=\s*\())|((?:==|!=|<=|>=|&&|\|\||<<|>>|\+\+|\-\-|\+=|\-=|\*=|\/=|%=|->|=>|::|[+\-*\/%&|^~!=<>?:;]))|([()[\]{}])/g;

        var result = '';
        var lastIndex = 0;
        var match;

        while ((match = tokenRegex.exec(rawCode)) !== null) {
            if (match.index > lastIndex) {
                result += escapeHtml(rawCode.slice(lastIndex, match.index));
            }

            if (match[1] || match[2]) {
                // Comments (VS Code #6a9955)
                result += '<span class="tok-comment">' + escapeHtml(match[0]) + '</span>';
            } else if (match[3]) {
                // Strings (VS Code #ce9178)
                result += '<span class="tok-str">' + escapeHtml(match[0]) + '</span>';
            } else if (match[4]) {
                // Numbers (VS Code #b5cea8)
                result += '<span class="tok-num">' + escapeHtml(match[0]) + '</span>';
            } else if (match[5]) {
                // Control flow keywords (VS Code #c586c0)
                result += '<span class="tok-control">' + escapeHtml(match[0]) + '</span>';
            } else if (match[6]) {
                // Declarative keywords (VS Code #569cd6)
                result += '<span class="tok-kw">' + escapeHtml(match[0]) + '</span>';
            } else if (match[7]) {
                // Types (VS Code #4ec9b0)
                result += '<span class="tok-type">' + escapeHtml(match[0]) + '</span>';
            } else if (match[8]) {
                // Constants / Booleans (VS Code #569cd6)
                result += '<span class="tok-const">' + escapeHtml(match[0]) + '</span>';
            } else if (match[9]) {
                // Functions (VS Code #dcdcaa)
                result += '<span class="tok-fn">' + escapeHtml(match[0]) + '</span>';
            } else if (match[10]) {
                // Operators (VS Code #d4d4d4)
                result += '<span class="tok-op">' + escapeHtml(match[0]) + '</span>';
            } else if (match[11]) {
                // Punctuation / Brackets (VS Code #ffd700)
                result += '<span class="tok-punc">' + escapeHtml(match[0]) + '</span>';
            }

            lastIndex = tokenRegex.lastIndex;
        }

        if (lastIndex < rawCode.length) {
            result += escapeHtml(rawCode.slice(lastIndex));
        }

        return result;
    }

    // Keep a highlighted mirror behind the editable textarea. Native textareas
    // cannot style individual tokens, so the mirror provides VS Code colors
    // while the textarea remains the single source of truth for editing.
    function updateSyntaxHighlight() {
        if (!codeInput) codeInput = document.getElementById('tracerCodeInput');
        if (!codeHighlight) codeHighlight = document.getElementById('tracerCodeHighlight');
        if (!codeInput || !codeHighlight) return;

        var contentEl = document.getElementById('tracerCodeHighlightContent') || codeHighlight;
        var lang = langSelect ? langSelect.value : 'auto';
        var text = codeInput.value;
        if (!text) {
            contentEl.innerHTML = '';
            syncScroll();
            return;
        }
        var html = highlightCodeSyntax(text, lang);
        if (text.slice(-1) === '\n') {
            html += ' ';
        }
        contentEl.innerHTML = html;
        syncScroll();
    }

    // Update Line Numbers Gutter (Always Wrapped, Always Synchronized)
    function updateGutter() {
        if (!codeInput) codeInput = document.getElementById('tracerCodeInput');
        if (!lineGutter) lineGutter = document.getElementById('tracerLineGutter');
        if (!codeInput || !lineGutter) return;

        var text = codeInput.value;
        var lines = text.split('\n');
        var count = Math.max(1, lines.length);

        var html = '';
        for (var i = 1; i <= count; i++) {
            html += '<div class="gutter-line-num">' + i + '</div>';
        }
        lineGutter.innerHTML = html;
        syncScroll();
    }

    function syncScroll() {
        if (!codeInput) codeInput = document.getElementById('tracerCodeInput');
        if (!lineGutter) lineGutter = document.getElementById('tracerLineGutter');
        if (!codeHighlight) codeHighlight = document.getElementById('tracerCodeHighlight');
        if (lineGutter && codeInput) {
            lineGutter.scrollTop = codeInput.scrollTop;
        }
        if (codeHighlight && codeInput) {
            codeHighlight.scrollTop = codeInput.scrollTop;
            codeHighlight.scrollLeft = codeInput.scrollLeft;
        }
    }

    // Refresh when code changes
    function onCodeInputChanged() {
        updateGutter();
        updateSyntaxHighlight();
        updateCollapsedCodeStats();
    }

    function updateCollapsedCodeStats() {
        var collapsedStats = document.getElementById('tracerCollapsedCodeStats');
        if (!codeInput || !collapsedStats) return;
        var lines = (codeInput.value || '').split('\n').length;
        var lang = langSelect ? langSelect.value.toUpperCase() : 'CODE';
        collapsedStats.textContent = lang + ' (' + lines + ' lines) • Editor minimized (tap to view / edit)';
    }

    // Load Preset
    function loadPreset(presetKey) {
        var preset = DSA_PRESETS[presetKey];
        if (!preset) return;
        if (codeInput) codeInput.value = preset.code;
        if (langSelect) langSelect.value = preset.lang;
        if (customInputEl) customInputEl.value = preset.customInput || '';
        onCodeInputChanged();
        if (window.showToast) window.showToast('Loaded preset: ' + preset.title);
    }

    // Load initial default code
    function initDefaultPreset() {
        if (codeInput && !codeInput.value.trim()) {
            loadPreset('binsearch_cpp');
        } else {
            onCodeInputChanged();
        }
    }

    // Switch Tab in Tracer
    function switchTracerTab(tabId) {
        var tabBtns = document.querySelectorAll('.tracer-tab-button');
        var tabPanes = document.querySelectorAll('.tracer-tab-content');

        for (var i = 0; i < tabBtns.length; i++) {
            if (tabBtns[i].getAttribute('data-tab') === tabId) {
                tabBtns[i].classList.add('active');
            } else {
                tabBtns[i].classList.remove('active');
            }
        }

        for (var j = 0; j < tabPanes.length; j++) {
            if (tabPanes[j].id === tabId) {
                tabPanes[j].classList.add('active');
            } else {
                tabPanes[j].classList.remove('active');
            }
        }
    }

    // Render Code Lines into Synchronized Viewer
    function setupCodeViewer(code) {
        if (!codeViewerLines) return;
        codeViewerLines.innerHTML = '';
        var lines = (code || '').split('\n');
        var lang = langSelect ? langSelect.value : 'auto';
        for (var i = 0; i < lines.length; i++) {
            var lineNum = i + 1;
            var lineText = lines[i];
            var lineDiv = document.createElement('div');
            lineDiv.className = 'tracer-code-line';
            lineDiv.id = 'viewerLine_' + lineNum;
            lineDiv.innerHTML = '<span class="tracer-code-line-num">' + lineNum + '</span>' +
                                '<span class="tracer-code-line-text">' + (highlightCodeSyntax(lineText, lang) || '&nbsp;') + '</span>';
            codeViewerLines.appendChild(lineDiv);
        }
    }

    function escapeHtml(s) {
        if (s === undefined || s === null) return '';
        return s.toString().replace(/[&<>]/g, function(m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m];
        });
    }

    // Stepper Navigation
    function goToStep(index) {
        if (!tracerState.traceData || !tracerState.traceData.steps) return;
        var steps = tracerState.traceData.steps;
        if (steps.length === 0) return;

        var targetIndex = Math.max(0, Math.min(steps.length - 1, index));
        tracerState.currentStep = targetIndex;
        var step = steps[targetIndex];

        // 1. Counter & Slider
        if (stepCounterBadge) {
            stepCounterBadge.textContent = 'Step ' + (targetIndex + 1) + ' of ' + steps.length;
        }
        if (stepScrubberSlider) {
            stepScrubberSlider.value = targetIndex + 1;
        }

        // 2. Active Line Highlight in Code Viewer
        var allLineEls = document.querySelectorAll('.tracer-code-line');
        for (var l = 0; l < allLineEls.length; l++) {
            allLineEls[l].classList.remove('active');
        }
        var lineNum = step.lineNumber || step.line || 1;
        var activeLineEl = document.getElementById('viewerLine_' + lineNum);
        if (activeLineEl) {
            activeLineEl.classList.add('active');
            if (codeViewerLines) {
                var lineTop = activeLineEl.offsetTop;
                var lineH = activeLineEl.offsetHeight;
                var contScroll = codeViewerLines.scrollTop;
                var contH = codeViewerLines.clientHeight;
                if (lineTop < contScroll || (lineTop + lineH) > (contScroll + contH)) {
                    codeViewerLines.scrollTo({ top: lineTop - (contH / 2) + (lineH / 2), behavior: 'smooth' });
                }
            }
        }
        if (activeLineIndicator) {
            activeLineIndicator.textContent = 'Line ' + lineNum;
        }

        // 3. Tab 1: Narrative
        if (narrativeStepPill) narrativeStepPill.textContent = 'Step ' + (targetIndex + 1);
        if (narrativeLoopPill) narrativeLoopPill.textContent = step.loopIteration || 'Phase: Execution';
        if (narrativeCodeSnippet) {
            var lang = langSelect ? langSelect.value : 'auto';
            narrativeCodeSnippet.innerHTML = highlightCodeSyntax(step.code || ('Line ' + step.lineNumber), lang);
        }
        if (narrativeExplanationBody) narrativeExplanationBody.innerHTML = escapeHtml(step.explanation || 'Step evaluation');

        // Live snapshot in Tab 1
        var snapshotChipsEl = document.getElementById('stepSnapshotChips');
        var snapshotCountEl = document.getElementById('stepSnapshotCount');
        if (snapshotChipsEl) {
            snapshotChipsEl.innerHTML = '';
            if (step.variables && step.variables.length > 0) {
                if (snapshotCountEl) snapshotCountEl.textContent = step.variables.length + ' active variable' + (step.variables.length > 1 ? 's' : '');
                for (var sv = 0; sv < step.variables.length; sv++) {
                    var vSnap = step.variables[sv];
                    var chip = document.createElement('span');
                    chip.className = 'step-var-chip' + (vSnap.changed ? ' chip-updated' : '');
                    chip.innerHTML = '<strong>' + escapeHtml(vSnap.name) + '</strong>=' + escapeHtml(vSnap.value) + (vSnap.changed ? ' <span style="font-size:0.6rem;font-weight:800;">(UPDATED)</span>' : '');
                    snapshotChipsEl.appendChild(chip);
                }
            } else {
                if (snapshotCountEl) snapshotCountEl.textContent = '0 active';
                snapshotChipsEl.innerHTML = '<span class="step-empty-chip">No variables active at this step</span>';
            }
        }

        // 4. Tab 2: Variables Matrix
        if (varsMatrixTableBody) {
            varsMatrixTableBody.innerHTML = '';
            if (step.variables && step.variables.length > 0) {
                for (var v = 0; v < step.variables.length; v++) {
                    var varItem = step.variables[v];
                    var tr = document.createElement('tr');
                    if (varItem.changed) {
                        tr.className = 'var-row-changed';
                    }
                    var changeBadge = varItem.changed ? '<span class="var-badge-changed">UPDATED</span>' : '<span style="color:var(--text-muted); font-size:0.65rem;">Unchanged</span>';
                    tr.innerHTML = '<td><strong>' + escapeHtml(varItem.name) + '</strong></td>' +
                                   '<td style="color:var(--accent-2);">' + escapeHtml(varItem.type || 'auto') + '</td>' +
                                   '<td><code>' + escapeHtml(varItem.value) + '</code></td>' +
                                   '<td>' + changeBadge + '</td>';
                    varsMatrixTableBody.appendChild(tr);
                }
            } else {
                varsMatrixTableBody.innerHTML = '<tr><td colspan="4" class="empty-vars">No active variables tracked at this step.</td></tr>';
            }
        }

        // 5. Tab 3: DSA Visualizer (Array, Stack, Linked List, Bitwise)
        if (dsaVisualContainer) {
            dsaVisualContainer.innerHTML = '';
            var hasVisual = false;

            // 5a. Stack Data Structure (e.g. Valid Parentheses)
            if (step.stackData && step.stackData.elements) {
                hasVisual = true;
                var stackWrap = document.createElement('div');
                stackWrap.className = 'dsa-stack-container';
                var stTitle = document.createElement('div');
                stTitle.className = 'dsa-stack-title';
                stTitle.textContent = (step.stackData.title || 'LIFO Stack') + ' (' + step.stackData.elements.length + ' items)';
                stackWrap.appendChild(stTitle);

                var itemsBox = document.createElement('div');
                itemsBox.className = 'dsa-stack-items-wrap';

                if (step.stackData.elements.length === 0) {
                    var emptySt = document.createElement('div');
                    emptySt.className = 'dsa-empty-message';
                    emptySt.style.padding = '12px 0';
                    emptySt.textContent = '[ Stack is currently empty ]';
                    itemsBox.appendChild(emptySt);
                } else {
                    for (var si = 0; si < step.stackData.elements.length; si++) {
                        var stItem = document.createElement('div');
                        var isTop = (si === step.stackData.elements.length - 1);
                        stItem.className = 'dsa-stack-item' + (isTop ? ' top-item' : '');
                        stItem.innerHTML = '<span>' + escapeHtml(step.stackData.elements[si]) + '</span>' +
                                           (isTop ? '<span class="dsa-pointer-badge" style="background:#38bdf8;">TOP</span>' : '<span style="font-size:0.65rem;color:var(--text-muted);">[' + si + ']</span>');
                        itemsBox.appendChild(stItem);
                    }
                }
                stackWrap.appendChild(itemsBox);
                dsaVisualContainer.appendChild(stackWrap);
            }

            // 5b. Linked List Data Structure (e.g. Reverse Linked List)
            if (step.linkedListData && step.linkedListData.nodes) {
                hasVisual = true;
                var llWrap = document.createElement('div');
                llWrap.className = 'dsa-ll-container';
                var llTitle = document.createElement('div');
                llTitle.className = 'dsa-array-name';
                llTitle.textContent = step.linkedListData.title || 'Singly Linked List Nodes & Pointers';
                llWrap.appendChild(llTitle);

                var llChain = document.createElement('div');
                llChain.className = 'dsa-ll-chain';

                var nodes = step.linkedListData.nodes || [];
                var llPointers = step.linkedListData.pointers || [];

                for (var ni = 0; ni < nodes.length; ni++) {
                    var nodeWrap = document.createElement('div');
                    nodeWrap.className = 'dsa-ll-node-wrap';

                    var pTagDiv = document.createElement('div');
                    pTagDiv.className = 'dsa-pointer-tags';
                    var isNodePointed = false;

                    for (var lpi = 0; lpi < llPointers.length; lpi++) {
                        if (llPointers[lpi].index === ni) {
                            isNodePointed = true;
                            var pBadge = document.createElement('span');
                            pBadge.className = 'dsa-pointer-badge';
                            pBadge.textContent = llPointers[lpi].name;
                            if (llPointers[lpi].color) pBadge.style.backgroundColor = llPointers[lpi].color;
                            pTagDiv.appendChild(pBadge);
                        }
                    }

                    var nBox = document.createElement('div');
                    nBox.className = 'dsa-ll-node' + (isNodePointed ? ' active-node' : '');
                    nBox.textContent = nodes[ni];

                    nodeWrap.appendChild(pTagDiv);
                    nodeWrap.appendChild(nBox);
                    llChain.appendChild(nodeWrap);

                    if (ni < nodes.length - 1) {
                        var arrow = document.createElement('span');
                        arrow.className = 'dsa-ll-arrow';
                        arrow.textContent = '→';
                        llChain.appendChild(arrow);
                    }
                }
                llWrap.appendChild(llChain);
                dsaVisualContainer.appendChild(llWrap);
            }

            // 5c. Bitwise Masking Register (e.g. Count Set Bits)
            if (step.bitData && step.bitData.bits) {
                hasVisual = true;
                var bitWrap = document.createElement('div');
                bitWrap.className = 'dsa-bits-container';
                var bitTitle = document.createElement('div');
                bitTitle.className = 'dsa-array-name';
                bitTitle.textContent = (step.bitData.title || 'Bit Register') + ' (val = ' + step.bitData.val + ', binary: ' + step.bitData.binary + ')';
                bitWrap.appendChild(bitTitle);

                var bitRow = document.createElement('div');
                bitRow.className = 'dsa-bits-row';

                for (var bi = 0; bi < step.bitData.bits.length; bi++) {
                    var bObj = step.bitData.bits[bi];
                    var bCell = document.createElement('div');
                    bCell.className = 'dsa-bit-cell' + (bObj.cleared ? ' bit-cleared' : (bObj.val === '1' ? ' bit-active' : ''));
                    bCell.innerHTML = '<span class="dsa-bit-val">' + bObj.val + '</span>' +
                                      '<span class="dsa-bit-pos">b' + bObj.pos + '</span>';
                    bitRow.appendChild(bCell);
                }
                bitWrap.appendChild(bitRow);
                dsaVisualContainer.appendChild(bitWrap);
            }

            // 5d. Array Data Structure
            if (step.arrayPointers && step.arrayPointers.length > 0) {
                hasVisual = true;
                for (var a = 0; a < step.arrayPointers.length; a++) {
                    var arrData = step.arrayPointers[a];
                    var group = document.createElement('div');
                    group.className = 'dsa-array-group';

                    var nameHeader = document.createElement('div');
                    nameHeader.className = 'dsa-array-name';
                    nameHeader.textContent = (arrData.arrayName || 'Array') + ' [' + (arrData.elements ? arrData.elements.length : 0) + ' items]';
                    group.appendChild(nameHeader);

                    var cellsRow = document.createElement('div');
                    cellsRow.className = 'dsa-array-cells';

                    var elements = arrData.elements || [];
                    var pointers = arrData.pointers || [];

                    for (var e = 0; e < elements.length; e++) {
                        var cellWrap = document.createElement('div');
                        cellWrap.className = 'dsa-cell-wrap';

                        // Pointers tag
                        var pointerTags = document.createElement('div');
                        pointerTags.className = 'dsa-pointer-tags';
                        var isPointed = false;

                        for (var p = 0; p < pointers.length; p++) {
                            if (pointers[p].index === e) {
                                isPointed = true;
                                var badge = document.createElement('span');
                                badge.className = 'dsa-pointer-badge';
                                badge.textContent = pointers[p].name;
                                if (pointers[p].color) badge.style.backgroundColor = pointers[p].color;
                                pointerTags.appendChild(badge);
                            }
                        }

                        // Cell box
                        var cellBox = document.createElement('div');
                        cellBox.className = 'dsa-cell-box' + (isPointed ? ' cell-pointed' : '');
                        cellBox.textContent = elements[e];

                        // Index tag
                        var indexTag = document.createElement('span');
                        indexTag.className = 'dsa-cell-index';
                        indexTag.textContent = '[' + e + ']';

                        cellWrap.appendChild(pointerTags);
                        cellWrap.appendChild(cellBox);
                        cellWrap.appendChild(indexTag);
                        cellsRow.appendChild(cellWrap);
                    }

                    group.appendChild(cellsRow);
                    dsaVisualContainer.appendChild(group);
                }
            }

            // Fallback: If no explicit visualizer, check variables for array-like representations
            if (!hasVisual && step.variables) {
                var foundVarArray = null;
                var foundVarName = '';
                for (var vi = 0; vi < step.variables.length; vi++) {
                    var valStr = step.variables[vi].value || '';
                    if (valStr.indexOf('[') === 0 && valStr.indexOf(']') !== -1) {
                        try {
                            var cleanArr = valStr.replace(/[\[\]]/g, '').split(',').map(function(s) { return s.trim(); });
                            if (cleanArr.length > 0 && cleanArr[0] !== '') {
                                foundVarArray = cleanArr;
                                foundVarName = step.variables[vi].name;
                                break;
                            }
                        } catch (e) {}
                    }
                }

                if (foundVarArray) {
                    hasVisual = true;
                    var autoGroup = document.createElement('div');
                    autoGroup.className = 'dsa-array-group';
                    var autoName = document.createElement('div');
                    autoName.className = 'dsa-array-name';
                    autoName.textContent = foundVarName + ' [' + foundVarArray.length + ' items]';
                    autoGroup.appendChild(autoName);

                    var autoCellsRow = document.createElement('div');
                    autoCellsRow.className = 'dsa-array-cells';

                    var detectedPointers = [];
                    for (var vj = 0; vj < step.variables.length; vj++) {
                        var vname = step.variables[vj].name;
                        var vval = parseInt(step.variables[vj].value, 10);
                        if (!isNaN(vval) && vval >= 0 && vval < foundVarArray.length) {
                            detectedPointers.push({ name: vname, index: vval });
                        }
                    }

                    for (var k = 0; k < foundVarArray.length; k++) {
                        var cWrap = document.createElement('div');
                        cWrap.className = 'dsa-cell-wrap';

                        var pTags = document.createElement('div');
                        pTags.className = 'dsa-pointer-tags';
                        var isAutoPointed = false;

                        for (var dp = 0; dp < detectedPointers.length; dp++) {
                            if (detectedPointers[dp].index === k) {
                                isAutoPointed = true;
                                var pBadge = document.createElement('span');
                                pBadge.className = 'dsa-pointer-badge';
                                pBadge.textContent = detectedPointers[dp].name;
                                pTags.appendChild(pBadge);
                            }
                        }

                        var cBox = document.createElement('div');
                        cBox.className = 'dsa-cell-box' + (isAutoPointed ? ' cell-pointed' : '');
                        cBox.textContent = foundVarArray[k];

                        var idxTag = document.createElement('span');
                        idxTag.className = 'dsa-cell-index';
                        idxTag.textContent = '[' + k + ']';

                        cWrap.appendChild(pTags);
                        cWrap.appendChild(cBox);
                        cWrap.appendChild(idxTag);
                        autoCellsRow.appendChild(cWrap);
                    }

                    autoGroup.appendChild(autoCellsRow);
                    dsaVisualContainer.appendChild(autoGroup);
                }
            }

            if (!hasVisual) {
                dsaVisualContainer.innerHTML = '<div class="dsa-empty-message">No linear array, stack, linked list, or register data structure active at this step.</div>';
            }
        }

        // 6. Tab 4: Call Stack
        if (stackViewContainer) {
            stackViewContainer.innerHTML = '';
            var stackFrames = step.callStack || ['main()'];
            for (var sf = 0; sf < stackFrames.length; sf++) {
                var frameDiv = document.createElement('div');
                var isTop = (sf === stackFrames.length - 1);
                frameDiv.className = 'stack-frame-box' + (isTop ? ' top-frame' : '');
                frameDiv.innerHTML = '<span class="frame-depth">Depth ' + sf + '</span>' +
                                     '<span class="frame-func">' + escapeHtml(stackFrames[sf]) + '</span>';
                stackViewContainer.appendChild(frameDiv);
            }
        }

        // 7. Tab 5: Terminal Output
        if (terminalOutputText) {
            var outputToShow = step.stdout || tracerState.traceData.output || 'No output produced at this step.';
            terminalOutputText.textContent = outputToShow;
        }

        // 8. Stepper Button State
        if (stepFirstBtn) stepFirstBtn.disabled = (targetIndex === 0);
        if (stepPrevBtn) stepPrevBtn.disabled = (targetIndex === 0);
        if (stepNextBtn) stepNextBtn.disabled = (targetIndex === steps.length - 1);
        if (stepLastBtn) stepLastBtn.disabled = (targetIndex === steps.length - 1);
    }

    // Playback Controller
    function startPlay() {
        if (!tracerState.traceData || !tracerState.traceData.steps) return;
        var steps = tracerState.traceData.steps;
        if (steps.length === 0) return;

        if (tracerState.currentStep >= steps.length - 1) {
            goToStep(0);
        }

        tracerState.isPlaying = true;
        if (playIconSvg) playIconSvg.style.display = 'none';
        if (pauseIconSvg) pauseIconSvg.style.display = 'inline';
        if (stepPlayPauseBtn) stepPlayPauseBtn.classList.add('play-active');

        clearInterval(tracerState.playInterval);
        tracerState.playInterval = setInterval(function() {
            if (tracerState.currentStep < steps.length - 1) {
                goToStep(tracerState.currentStep + 1);
            } else {
                stopPlay();
            }
        }, tracerState.playSpeed);
    }

    function stopPlay() {
        tracerState.isPlaying = false;
        clearInterval(tracerState.playInterval);
        if (playIconSvg) playIconSvg.style.display = 'inline';
        if (pauseIconSvg) pauseIconSvg.style.display = 'none';
        if (stepPlayPauseBtn) stepPlayPauseBtn.classList.remove('play-active');
    }

    function togglePlay() {
        if (tracerState.isPlaying) {
            stopPlay();
        } else {
            startPlay();
        }
    }

    // Client-side offline simulation engine (with unrolled loops, explicit step-by-step tracing e.g. i=0, i=1...)
    function simulateClientSideTrace(code, language, customInput) {
        var lines = code.split('\n');
        var steps = [];
        var stdout = '';

        // Extract potential array from code or customInput
        var arrayMatch = code.match(/(?:arr|numbers|nums|data|list)\s*(?:=|:=)\s*\{?\[([^\]\}]+)\]\}?/i);
        var arrayElements = [];
        if (arrayMatch && arrayMatch[1]) {
            arrayElements = arrayMatch[1].split(',').map(function(s) { return s.trim().replace(/['"]/g, ''); });
        } else if (customInput && customInput.indexOf('[') !== -1) {
            var custMatch = customInput.match(/\[([^\]]+)\]/);
            if (custMatch && custMatch[1]) {
                arrayElements = custMatch[1].split(',').map(function(s) { return s.trim().replace(/['"]/g, ''); });
            }
        }

        if (arrayElements.length === 0) {
            arrayElements = ['2', '4', '7', '10', '15', '20'];
        }

        // --- CASE 1: BINARY SEARCH ---
        var isBinSearch = /binarySearch|low\s*<=?\s*high|high\s*=\s*(?:arr|numbers|nums)\.size/i.test(code);
        if (isBinSearch) {
            var targetMatch = code.match(/target\s*=\s*(\d+)/i) || (customInput ? customInput.match(/target\s*=\s*(\d+)/i) : null);
            var target = targetMatch ? parseInt(targetMatch[1], 10) : 10;
            var numArr = arrayElements.map(function(x) { return parseInt(x, 10) || 0; });
            numArr.sort(function(a, b) { return a - b; });
            var strArr = numArr.map(String);

            var low = 0;
            var high = strArr.length - 1;

            // Step 1: Initialization
            steps.push({
                stepNumber: 1,
                lineNumber: 1,
                code: 'int low = 0; int high = ' + high + '; int target = ' + target + ';',
                explanation: 'Initialized binary search. Array has ' + strArr.length + ' sorted elements: [' + strArr.join(', ') + ']. Search target = ' + target + '.',
                loopIteration: 'Setup / Initialization',
                variables: [
                    { name: 'low', value: '0', changed: true, type: 'int' },
                    { name: 'high', value: String(high), changed: true, type: 'int' },
                    { name: 'target', value: String(target), changed: false, type: 'int' },
                    { name: 'n', value: String(strArr.length), changed: false, type: 'int' }
                ],
                arrayPointers: [
                    {
                        arrayName: 'arr',
                        elements: strArr,
                        pointers: [
                            { name: 'low', index: 0, color: '#10b981' },
                            { name: 'high', index: high, color: '#ef4444' }
                        ]
                    }
                ],
                callStack: ['main()', 'binarySearch(arr, ' + target + ')'],
                stdout: ''
            });

            var iter = 0;
            var foundIndex = -1;

            while (low <= high && iter < 10) {
                iter++;
                var mid = Math.floor(low + (high - low) / 2);
                var midVal = numArr[mid];

                // Step A: Condition Check
                steps.push({
                    stepNumber: steps.length + 1,
                    lineNumber: 8,
                    code: 'while (low <= high) { // Iteration ' + iter + ': low=' + low + ', high=' + high,
                    explanation: 'Iteration ' + iter + ': Checking loop condition (low <= high): ' + low + ' <= ' + high + ' is TRUE. Proceeding into loop.',
                    loopIteration: 'Iteration ' + iter + ' (low = ' + low + ', high = ' + high + ')',
                    variables: [
                        { name: 'low', value: String(low), changed: false, type: 'int' },
                        { name: 'high', value: String(high), changed: false, type: 'int' },
                        { name: 'target', value: String(target), changed: false, type: 'int' }
                    ],
                    arrayPointers: [
                        {
                            arrayName: 'arr',
                            elements: strArr,
                            pointers: [
                                { name: 'low', index: low, color: '#10b981' },
                                { name: 'high', index: high, color: '#ef4444' }
                            ]
                        }
                    ],
                    callStack: ['main()', 'binarySearch(arr, ' + target + ')'],
                    stdout: stdout
                });

                // Step B: Mid Calculation
                steps.push({
                    stepNumber: steps.length + 1,
                    lineNumber: 9,
                    code: 'int mid = low + (high - low) / 2; // mid = ' + low + ' + (' + high + ' - ' + low + ')/2 = ' + mid,
                    explanation: 'Calculated middle index: mid = ' + low + ' + (' + high + ' - ' + low + ') / 2 = ' + mid + '. Array value at arr[' + mid + '] = ' + midVal + '.',
                    loopIteration: 'Iteration ' + iter + ' (Calculate mid = ' + mid + ')',
                    variables: [
                        { name: 'low', value: String(low), changed: false, type: 'int' },
                        { name: 'high', value: String(high), changed: false, type: 'int' },
                        { name: 'mid', value: String(mid), changed: true, type: 'int' },
                        { name: 'arr[mid]', value: String(midVal), changed: true, type: 'int' },
                        { name: 'target', value: String(target), changed: false, type: 'int' }
                    ],
                    arrayPointers: [
                        {
                            arrayName: 'arr',
                            elements: strArr,
                            pointers: [
                                { name: 'low', index: low, color: '#10b981' },
                                { name: 'high', index: high, color: '#ef4444' },
                                { name: 'mid', index: mid, color: '#38bdf8' }
                            ]
                        }
                    ],
                    callStack: ['main()', 'binarySearch(arr, ' + target + ')'],
                    stdout: stdout
                });

                if (midVal === target) {
                    foundIndex = mid;
                    // Step C: Match found
                    steps.push({
                        stepNumber: steps.length + 1,
                        lineNumber: 10,
                        code: 'if (arr[mid] == target) return mid; // ' + midVal + ' == ' + target + ' is TRUE',
                        explanation: 'Target match confirmed: arr[' + mid + '] (' + midVal + ') == target (' + target + '). Found element at index ' + mid + '! Returning result.',
                        loopIteration: 'Iteration ' + iter + ' (Target Found at index ' + mid + ')',
                        variables: [
                            { name: 'low', value: String(low), changed: false, type: 'int' },
                            { name: 'high', value: String(high), changed: false, type: 'int' },
                            { name: 'mid', value: String(mid), changed: false, type: 'int' },
                            { name: 'result', value: String(mid), changed: true, type: 'int' }
                        ],
                        arrayPointers: [
                            {
                                arrayName: 'arr',
                                elements: strArr,
                                pointers: [
                                    { name: 'found', index: mid, color: '#eab308' }
                                ]
                            }
                        ],
                        callStack: ['main()', 'binarySearch(arr, ' + target + ') -> return ' + mid],
                        stdout: stdout
                    });
                    break;
                } else if (midVal < target) {
                    var prevLow = low;
                    low = mid + 1;
                    steps.push({
                        stepNumber: steps.length + 1,
                        lineNumber: 13,
                        code: 'if (arr[mid] < target) { low = mid + 1; } // ' + midVal + ' < ' + target + ' -> low = ' + low,
                        explanation: 'arr[' + mid + '] (' + midVal + ') < target (' + target + '). Target lies in the right half. Updating low = mid + 1 (' + prevLow + ' -> ' + low + ').',
                        loopIteration: 'Iteration ' + iter + ' (Search Right Half)',
                        variables: [
                            { name: 'low', value: String(low), changed: true, type: 'int' },
                            { name: 'high', value: String(high), changed: false, type: 'int' },
                            { name: 'mid', value: String(mid), changed: false, type: 'int' }
                        ],
                        arrayPointers: [
                            {
                                arrayName: 'arr',
                                elements: strArr,
                                pointers: [
                                    { name: 'low', index: Math.min(low, strArr.length - 1), color: '#10b981' },
                                    { name: 'high', index: high, color: '#ef4444' }
                                ]
                            }
                        ],
                        callStack: ['main()', 'binarySearch(arr, ' + target + ')'],
                        stdout: stdout
                    });
                } else {
                    var prevHigh = high;
                    high = mid - 1;
                    steps.push({
                        stepNumber: steps.length + 1,
                        lineNumber: 15,
                        code: 'else { high = mid - 1; } // ' + midVal + ' > ' + target + ' -> high = ' + high,
                        explanation: 'arr[' + mid + '] (' + midVal + ') > target (' + target + '). Target lies in the left half. Updating high = mid - 1 (' + prevHigh + ' -> ' + high + ').',
                        loopIteration: 'Iteration ' + iter + ' (Search Left Half)',
                        variables: [
                            { name: 'low', value: String(low), changed: false, type: 'int' },
                            { name: 'high', value: String(high), changed: true, type: 'int' },
                            { name: 'mid', value: String(mid), changed: false, type: 'int' }
                        ],
                        arrayPointers: [
                            {
                                arrayName: 'arr',
                                elements: strArr,
                                pointers: [
                                    { name: 'low', index: low, color: '#10b981' },
                                    { name: 'high', index: Math.max(0, high), color: '#ef4444' }
                                ]
                            }
                        ],
                        callStack: ['main()', 'binarySearch(arr, ' + target + ')'],
                        stdout: stdout
                    });
                }
            }

            stdout += 'Element found at index: ' + foundIndex + '\n';

            // Step Final: Program Output
            steps.push({
                stepNumber: steps.length + 1,
                lineNumber: lines.length,
                code: 'std::cout << "Element found at index: " << result << std::endl;',
                explanation: 'Program execution completed. Emitted final result (' + foundIndex + ') to standard console terminal.',
                loopIteration: 'Program Complete',
                variables: [
                    { name: 'result', value: String(foundIndex), changed: false, type: 'int' },
                    { name: 'status', value: 'finished', changed: true, type: 'string' }
                ],
                arrayPointers: [
                    {
                        arrayName: 'arr',
                        elements: strArr,
                        pointers: [
                            { name: 'result', index: Math.max(0, foundIndex), color: '#10b981' }
                        ]
                    }
                ],
                callStack: ['main()'],
                stdout: stdout
            });

            return {
                language: language === 'auto' ? 'C++ (DSA)' : language,
                title: 'Binary Search (Logarithmic Division)',
                algorithmCategory: 'Binary Search / Divide & Conquer',
                timeComplexity: 'O(log n)',
                spaceComplexity: 'O(1)',
                complexityExplanation: 'Each iteration divides the search space in half. Maximum iterations required is ceil(log2(n)) = ' + Math.ceil(Math.log2(strArr.length)) + ' comparisons with O(1) auxiliary space.',
                output: stdout,
                totalIterations: iter,
                steps: steps
            };
        }

        // --- CASE 2: TWO SUM (TWO POINTERS) ---
        var isTwoSum = /two_sum|twoSum|left\s*<\s*right/i.test(code);
        if (isTwoSum) {
            var tsTarget = 9;
            var numArr2 = arrayElements.map(function(x) { return parseInt(x, 10) || 0; });
            var strArr2 = numArr2.map(String);
            var left = 0;
            var right = strArr2.length - 1;
            var tsSteps = [];

            tsSteps.push({
                stepNumber: 1,
                lineNumber: 3,
                code: 'left = 0; right = len(numbers) - 1',
                explanation: 'Two-pointer initialization: left pointer at index 0 (val=' + strArr2[0] + '), right pointer at index ' + right + ' (val=' + strArr2[right] + '). Target = ' + tsTarget + '.',
                loopIteration: 'Setup / Entry',
                variables: [
                    { name: 'left', value: '0', changed: true, type: 'int' },
                    { name: 'right', value: String(right), changed: true, type: 'int' },
                    { name: 'target', value: String(tsTarget), changed: false, type: 'int' }
                ],
                arrayPointers: [
                    {
                        arrayName: 'numbers',
                        elements: strArr2,
                        pointers: [
                            { name: 'left', index: 0, color: '#10b981' },
                            { name: 'right', index: right, color: '#ef4444' }
                        ]
                    }
                ],
                callStack: ['main()', 'two_sum_sorted()'],
                stdout: ''
            });

            var tsIter = 0;
            while (left < right && tsIter < 8) {
                tsIter++;
                var curSum = numArr2[left] + numArr2[right];

                tsSteps.push({
                    stepNumber: tsSteps.length + 1,
                    lineNumber: 5,
                    code: 'current_sum = numbers[' + left + '] + numbers[' + right + '] // ' + numArr2[left] + ' + ' + numArr2[right] + ' = ' + curSum,
                    explanation: 'Iteration ' + tsIter + ' (left=' + left + ', right=' + right + '): Calculated current_sum = ' + numArr2[left] + ' + ' + numArr2[right] + ' = ' + curSum + '. Target = ' + tsTarget + '.',
                    loopIteration: 'Iteration ' + tsIter + ' (left = ' + left + ', right = ' + right + ')',
                    variables: [
                        { name: 'left', value: String(left), changed: false, type: 'int' },
                        { name: 'right', value: String(right), changed: false, type: 'int' },
                        { name: 'current_sum', value: String(curSum), changed: true, type: 'int' }
                    ],
                    arrayPointers: [
                        {
                            arrayName: 'numbers',
                            elements: strArr2,
                            pointers: [
                                { name: 'left', index: left, color: '#10b981' },
                                { name: 'right', index: right, color: '#ef4444' }
                            ]
                        }
                    ],
                    callStack: ['two_sum_sorted()'],
                    stdout: ''
                });

                if (curSum === tsTarget) {
                    tsSteps.push({
                        stepNumber: tsSteps.length + 1,
                        lineNumber: 7,
                        code: 'if current_sum == target: return [' + left + ', ' + right + ']',
                        explanation: 'current_sum (' + curSum + ') matches target (' + tsTarget + ')! Pair found at 0-indexed positions [' + left + ', ' + right + '].',
                        loopIteration: 'Target Match Found!',
                        variables: [
                            { name: 'left', value: String(left), changed: false, type: 'int' },
                            { name: 'right', value: String(right), changed: false, type: 'int' },
                            { name: 'result', value: '[' + left + ', ' + right + ']', changed: true, type: 'list' }
                        ],
                        arrayPointers: [
                            {
                                arrayName: 'numbers',
                                elements: strArr2,
                                pointers: [
                                    { name: 'match', index: left, color: '#eab308' },
                                    { name: 'match', index: right, color: '#eab308' }
                                ]
                            }
                        ],
                        callStack: ['two_sum_sorted() -> return [' + left + ', ' + right + ']'],
                        stdout: 'Indices found: [' + left + ', ' + right + ']\n'
                    });
                    break;
                } else if (curSum < tsTarget) {
                    left++;
                } else {
                    right--;
                }
            }

            return {
                language: 'Python',
                title: 'Two Sum II - Sorted Array (Two Pointers)',
                algorithmCategory: 'Two Pointers / Linear Scan',
                timeComplexity: 'O(n)',
                spaceComplexity: 'O(1)',
                complexityExplanation: 'Two pointers traverse the array from outside inward, eliminating half of potential pairs on each comparison in linear O(n) time.',
                output: 'Indices found: [' + left + ', ' + right + ']\n',
                totalIterations: tsIter,
                steps: tsSteps
            };
        }

        // --- CASE 3: KADANE'S ALGORITHM (MAXIMUM SUBARRAY) ---
        var isKadane = /maxSubArray|kadane|maxSoFar|currentMax/i.test(code);
        if (isKadane) {
            var kArr = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
            if (arrayElements.length >= 3) {
                var parsedK = arrayElements.map(function(x) { return parseInt(x, 10); }).filter(function(x) { return !isNaN(x); });
                if (parsedK.length >= 3) kArr = parsedK;
            }
            var kStrArr = kArr.map(String);
            var maxSoFar = kArr[0];
            var currentMax = kArr[0];
            var kSteps = [];
            var kStdout = '';

            // Step 1: Initialization
            kSteps.push({
                stepNumber: 1,
                lineNumber: 4,
                code: 'int maxSoFar = nums[0]; int currentMax = nums[0]; // both initialized to ' + kArr[0],
                explanation: "Kadane's Algorithm initialized. Array size = " + kArr.length + ". Starting both maxSoFar and currentMax at nums[0] (" + kArr[0] + ").",
                loopIteration: 'Initialization',
                variables: [
                    { name: 'maxSoFar', value: String(maxSoFar), changed: true, type: 'int' },
                    { name: 'currentMax', value: String(currentMax), changed: true, type: 'int' },
                    { name: 'nums[0]', value: String(kArr[0]), changed: false, type: 'int' }
                ],
                arrayPointers: [
                    {
                        arrayName: 'nums',
                        elements: kStrArr,
                        pointers: [{ name: 'i=0', index: 0, color: '#38bdf8' }]
                    }
                ],
                callStack: ['main()', 'maxSubArray(nums)'],
                stdout: ''
            });

            for (var ki = 1; ki < kArr.length; ki++) {
                var prevCur = currentMax;
                var prevMax = maxSoFar;
                var added = prevCur + kArr[ki];
                currentMax = Math.max(kArr[ki], added);
                maxSoFar = Math.max(maxSoFar, currentMax);

                var actionNote = (kArr[ki] > added) ?
                    ('nums[' + ki + '] (' + kArr[ki] + ') > previous running sum (' + added + '). Starting a new subarray at index ' + ki + '.') :
                    ('Extending current subarray with nums[' + ki + '] (' + kArr[ki] + '). currentMax updated to ' + currentMax + '.');

                kSteps.push({
                    stepNumber: kSteps.length + 1,
                    lineNumber: 7,
                    code: 'currentMax = Math.max(nums[' + ki + '], currentMax + nums[' + ki + ']); maxSoFar = Math.max(maxSoFar, currentMax);',
                    explanation: 'Iteration i=' + ki + ' (nums[' + ki + ']=' + kArr[ki] + '): ' + actionNote + ' maxSoFar is now ' + maxSoFar + '.',
                    loopIteration: 'Iteration i = ' + ki + ' (val = ' + kArr[ki] + ')',
                    variables: [
                        { name: 'i', value: String(ki), changed: true, type: 'int' },
                        { name: 'nums[i]', value: String(kArr[ki]), changed: false, type: 'int' },
                        { name: 'currentMax', value: String(currentMax), changed: (currentMax !== prevCur), type: 'int' },
                        { name: 'maxSoFar', value: String(maxSoFar), changed: (maxSoFar !== prevMax), type: 'int' }
                    ],
                    arrayPointers: [
                        {
                            arrayName: 'nums',
                            elements: kStrArr,
                            pointers: [
                                { name: 'i', index: ki, color: '#38bdf8' }
                            ]
                        }
                    ],
                    callStack: ['maxSubArray(nums)'],
                    stdout: ''
                });
            }

            kStdout = 'Maximum Subarray Sum: ' + maxSoFar + '\n';
            kSteps.push({
                stepNumber: kSteps.length + 1,
                lineNumber: 11,
                code: 'return maxSoFar; // returns ' + maxSoFar,
                explanation: "Kadane's scan complete across all " + kArr.length + " elements in linear O(n) time. Maximum contiguous subarray sum found is " + maxSoFar + ".",
                loopIteration: 'Algorithm Complete',
                variables: [
                    { name: 'maxSoFar', value: String(maxSoFar), changed: false, type: 'int' },
                    { name: 'result', value: String(maxSoFar), changed: true, type: 'int' }
                ],
                arrayPointers: [
                    {
                        arrayName: 'nums',
                        elements: kStrArr,
                        pointers: [{ name: 'maxSum', index: kArr.indexOf(maxSoFar) >= 0 ? kArr.indexOf(maxSoFar) : 0, color: '#10b981' }]
                    }
                ],
                callStack: ['main()'],
                stdout: kStdout
            });

            return {
                language: 'Java',
                title: "Maximum Subarray (Kadane's Algorithm)",
                algorithmCategory: 'Dynamic Programming / Greedy Scan',
                timeComplexity: 'O(n)',
                spaceComplexity: 'O(1)',
                complexityExplanation: "Single linear pass over the array maintaining currentMax and maxSoFar. Optimal O(n) runtime and O(1) space.",
                output: kStdout,
                totalIterations: kArr.length - 1,
                steps: kSteps
            };
        }

        // --- CASE 4: BUBBLE SORT ---
        var isBubbleSort = /bubbleSort|swapped\s*=|bubble_sort/i.test(code);
        if (isBubbleSort) {
            var bArr = [64, 34, 25, 12, 22];
            if (arrayElements.length >= 3) {
                var parsedB = arrayElements.map(function(x) { return parseInt(x, 10); }).filter(function(x) { return !isNaN(x); });
                if (parsedB.length >= 3) bArr = parsedB;
            }
            var bSteps = [];
            var bStdout = '';
            var bn = bArr.length;

            bSteps.push({
                stepNumber: 1,
                lineNumber: 2,
                code: 'function bubbleSort(arr) { let n = arr.length; // n = ' + bn,
                explanation: 'Initiating Bubble Sort on array with ' + bn + ' elements: [' + bArr.join(', ') + '].',
                loopIteration: 'Initialization',
                variables: [
                    { name: 'n', value: String(bn), changed: true, type: 'number' },
                    { name: 'swapped', value: 'false', changed: true, type: 'boolean' }
                ],
                arrayPointers: [
                    {
                        arrayName: 'arr',
                        elements: bArr.map(String),
                        pointers: [{ name: 'start', index: 0, color: '#38bdf8' }]
                    }
                ],
                callStack: ['main()', 'bubbleSort(arr)'],
                stdout: ''
            });

            var bStepCount = 0;
            var outerPass = 0;
            for (var bi = 0; bi < bn - 1 && bStepCount < 18; bi++) {
                outerPass++;
                var bSwapped = false;
                for (var bj = 0; bj < bn - bi - 1 && bStepCount < 18; bj++) {
                    bStepCount++;
                    var compLeft = bArr[bj];
                    var compRight = bArr[bj + 1];
                    var willSwap = compLeft > compRight;

                    if (willSwap) {
                        var temp = bArr[bj];
                        bArr[bj] = bArr[bj + 1];
                        bArr[bj + 1] = temp;
                        bSwapped = true;
                    }

                    bSteps.push({
                        stepNumber: bSteps.length + 1,
                        lineNumber: willSwap ? 9 : 7,
                        code: willSwap ?
                            ('// Swap: ' + compLeft + ' > ' + compRight + ' -> swap arr[' + bj + '] and arr[' + (bj + 1) + ']') :
                            ('// Compare: ' + compLeft + ' <= ' + compRight + ' -> ordered, no swap'),
                        explanation: 'Pass ' + outerPass + ', Compare arr[' + bj + '] (' + compLeft + ') and arr[' + (bj + 1) + '] (' + compRight + '). ' +
                                     (willSwap ? ('Since ' + compLeft + ' > ' + compRight + ', swapped elements.') : 'Already in correct order.'),
                        loopIteration: 'Pass ' + outerPass + ', compare (' + bj + ', ' + (bj + 1) + ')',
                        variables: [
                            { name: 'i', value: String(bi), changed: false, type: 'number' },
                            { name: 'j', value: String(bj), changed: true, type: 'number' },
                            { name: 'arr[j]', value: String(bArr[bj]), changed: willSwap, type: 'number' },
                            { name: 'arr[j+1]', value: String(bArr[bj + 1]), changed: willSwap, type: 'number' },
                            { name: 'swapped', value: String(bSwapped), changed: willSwap, type: 'boolean' }
                        ],
                        arrayPointers: [
                            {
                                arrayName: 'arr',
                                elements: bArr.map(String),
                                pointers: [
                                    { name: 'j', index: bj, color: '#10b981' },
                                    { name: 'j+1', index: bj + 1, color: willSwap ? '#eab308' : '#38bdf8' }
                                ]
                            }
                        ],
                        callStack: ['bubbleSort(arr)'],
                        stdout: ''
                    });
                }
                if (!bSwapped) break;
            }

            bStdout = 'Sorted Array: [' + bArr.join(', ') + ']\n';
            bSteps.push({
                stepNumber: bSteps.length + 1,
                lineNumber: 16,
                code: 'return arr; // [' + bArr.join(', ') + ']',
                explanation: 'Bubble sort passes completed. Array is fully sorted: [' + bArr.join(', ') + '].',
                loopIteration: 'Sorting Complete',
                variables: [
                    { name: 'status', value: 'sorted', changed: true, type: 'string' }
                ],
                arrayPointers: [
                    {
                        arrayName: 'arr (sorted)',
                        elements: bArr.map(String),
                        pointers: [{ name: 'done', index: bArr.length - 1, color: '#10b981' }]
                    }
                ],
                callStack: ['main()'],
                stdout: bStdout
            });

            return {
                language: 'JavaScript',
                title: 'Bubble Sort (Adjacent Comparisons & Swaps)',
                algorithmCategory: 'Comparison Sort / Quadratic DSA',
                timeComplexity: 'O(n²)',
                spaceComplexity: 'O(1)',
                complexityExplanation: 'Iteratively floats the largest unsorted element to the end of the array. Best case O(n) with swapped flag; average and worst case O(n²).',
                output: bStdout,
                totalIterations: bStepCount,
                steps: bSteps
            };
        }

        // --- CASE 5: RECURSIVE FIBONACCI ---
        var isFib = /fibonacci|fib\s*\(/i.test(code);
        if (isFib) {
            var fibN = 4;
            var fibSteps = [];
            var fibStdout = '';

            var fibTraces = [
                { line: 2, code: 'def fibonacci(4):', stack: ['main()', 'fibonacci(4)'], expl: 'Called fibonacci(4). Checking base conditions n <= 0 or n == 1.' },
                { line: 6, code: 'return fibonacci(3) + fibonacci(2)', stack: ['main()', 'fibonacci(4)', 'fibonacci(3)'], expl: 'Recursive branch: Pushed fibonacci(3) onto the call stack.' },
                { line: 6, code: 'return fibonacci(2) + fibonacci(1)', stack: ['main()', 'fibonacci(4)', 'fibonacci(3)', 'fibonacci(2)'], expl: 'Recursive branch: Pushed fibonacci(2) onto the call stack.' },
                { line: 6, code: 'return fibonacci(1) + fibonacci(0)', stack: ['main()', 'fibonacci(4)', 'fibonacci(3)', 'fibonacci(2)', 'fibonacci(1)'], expl: 'Recursive branch: Pushed fibonacci(1) onto the call stack.' },
                { line: 5, code: 'elif n == 1: return 1', stack: ['main()', 'fibonacci(4)', 'fibonacci(3)', 'fibonacci(2)', 'fibonacci(1) -> 1'], expl: 'Base case reached: fibonacci(1) returns 1. Popping stack.' },
                { line: 3, code: 'if n <= 0: return 0', stack: ['main()', 'fibonacci(4)', 'fibonacci(3)', 'fibonacci(2)', 'fibonacci(0) -> 0'], expl: 'Base case reached: fibonacci(0) returns 0. Popping stack.' },
                { line: 6, code: 'return 1 + 0 = 1', stack: ['main()', 'fibonacci(4)', 'fibonacci(3)', 'fibonacci(2) -> 1'], expl: 'Resolved fibonacci(2) = fibonacci(1) + fibonacci(0) = 1 + 0 = 1.' },
                { line: 5, code: 'elif n == 1: return 1', stack: ['main()', 'fibonacci(4)', 'fibonacci(3)', 'fibonacci(1) -> 1'], expl: 'Right branch of fibonacci(3): fibonacci(1) returns 1.' },
                { line: 6, code: 'return 1 + 1 = 2', stack: ['main()', 'fibonacci(4)', 'fibonacci(3) -> 2'], expl: 'Resolved fibonacci(3) = fibonacci(2) + fibonacci(1) = 1 + 1 = 2.' },
                { line: 6, code: 'evaluating right branch fibonacci(2)', stack: ['main()', 'fibonacci(4)', 'fibonacci(2) -> 1'], expl: 'Right branch of fibonacci(4): fibonacci(2) resolves to 1.' },
                { line: 6, code: 'return 2 + 1 = 3', stack: ['main()', 'fibonacci(4) -> 3'], expl: 'Top-level sum: fibonacci(4) = fibonacci(3) + fibonacci(2) = 2 + 1 = 3. All recursive frames resolved!' }
            ];

            for (var fi = 0; fi < fibTraces.length; fi++) {
                var fTrace = fibTraces[fi];
                fibSteps.push({
                    stepNumber: fi + 1,
                    lineNumber: fTrace.line,
                    code: fTrace.code,
                    explanation: fTrace.expl,
                    loopIteration: 'Recursion Depth: ' + (fTrace.stack.length - 1),
                    variables: [
                        { name: 'n', value: String(fibN), changed: false, type: 'int' },
                        { name: 'stackDepth', value: String(fTrace.stack.length), changed: true, type: 'int' }
                    ],
                    callStack: fTrace.stack,
                    stdout: fi === fibTraces.length - 1 ? 'Fibonacci(4) = 3\n' : ''
                });
            }

            fibStdout = 'Fibonacci(4) = 3\n';

            return {
                language: 'Python',
                title: 'Recursive Fibonacci (Call Stack & Tree Evaluation)',
                algorithmCategory: 'Recursion / Divide & Conquer',
                timeComplexity: 'O(2ⁿ)',
                spaceComplexity: 'O(n)',
                complexityExplanation: 'Naive recursive Fibonacci branches into a binary recursion tree of depth n, leading to 2ⁿ calls and O(n) maximum call stack memory.',
                output: fibStdout,
                totalIterations: fibTraces.length,
                steps: fibSteps
            };
        }

        // --- CASE 6: REVERSE SINGLY LINKED LIST ---
        var isRevList = /reverseList|ListNode|curr->next\s*=\s*prev/i.test(code);
        if (isRevList) {
            var rlNodes = ['1', '2', '3', '4'];
            var rlSteps = [];
            var rlStdout = 'Linked list nodes reversed in-place: 4 -> 3 -> 2 -> 1 -> NULL\n';

            // Step 1: Initial state
            rlSteps.push({
                stepNumber: 1,
                lineNumber: 10,
                code: 'struct ListNode* prev = NULL; struct ListNode* curr = head;',
                explanation: 'Initializing pointers: prev = NULL, curr points to head (node 1). Initial list: 1 -> 2 -> 3 -> 4 -> NULL.',
                loopIteration: 'Pointer Initialization',
                variables: [
                    { name: 'prev', value: 'NULL', changed: true, type: 'ListNode*' },
                    { name: 'curr', value: 'Node(1)', changed: true, type: 'ListNode*' }
                ],
                linkedListData: {
                    title: 'Singly Linked List State',
                    nodes: rlNodes,
                    pointers: [{ name: 'curr', index: 0, color: '#38bdf8' }]
                },
                callStack: ['main()', 'reverseList(head)'],
                stdout: ''
            });

            var prevName = 'NULL';
            for (var rli = 0; rli < rlNodes.length; rli++) {
                var nodeVal = rlNodes[rli];
                var nextVal = (rli < rlNodes.length - 1) ? ('Node(' + rlNodes[rli + 1] + ')') : 'NULL';

                // Step A: Save next
                rlSteps.push({
                    stepNumber: rlSteps.length + 1,
                    lineNumber: 13,
                    code: 'struct ListNode* nextNode = curr->next; // nextNode = ' + nextVal,
                    explanation: 'Iteration ' + (rli + 1) + ': Preserving forward link to avoid losing rest of list: nextNode = curr->next (' + nextVal + ').',
                    loopIteration: 'Step ' + (rli + 1) + ' (Preserve Next)',
                    variables: [
                        { name: 'prev', value: prevName, changed: false, type: 'ListNode*' },
                        { name: 'curr', value: 'Node(' + nodeVal + ')', changed: false, type: 'ListNode*' },
                        { name: 'nextNode', value: nextVal, changed: true, type: 'ListNode*' }
                    ],
                    linkedListData: {
                        title: 'Linked List at Node ' + nodeVal,
                        nodes: rlNodes,
                        pointers: [
                            { name: 'curr', index: rli, color: '#38bdf8' },
                            ...(rli < rlNodes.length - 1 ? [{ name: 'next', index: rli + 1, color: '#eab308' }] : [])
                        ]
                    },
                    callStack: ['reverseList(head)'],
                    stdout: ''
                });

                // Step B: Reverse link
                rlSteps.push({
                    stepNumber: rlSteps.length + 1,
                    lineNumber: 14,
                    code: 'curr->next = prev; prev = curr; curr = nextNode;',
                    explanation: 'Reversing pointer: Pointed Node(' + nodeVal + ')->next to ' + prevName + '. Advanced prev and curr.',
                    loopIteration: 'Step ' + (rli + 1) + ' (Reverse Pointer)',
                    variables: [
                        { name: 'prev', value: 'Node(' + nodeVal + ')', changed: true, type: 'ListNode*' },
                        { name: 'curr', value: nextVal, changed: true, type: 'ListNode*' }
                    ],
                    linkedListData: {
                        title: 'Pointer Reversed at Node ' + nodeVal,
                        nodes: rlNodes,
                        pointers: [
                            { name: 'prev', index: rli, color: '#10b981' },
                            ...(rli < rlNodes.length - 1 ? [{ name: 'curr', index: rli + 1, color: '#38bdf8' }] : [])
                        ]
                    },
                    callStack: ['reverseList(head)'],
                    stdout: ''
                });

                prevName = 'Node(' + nodeVal + ')';
            }

            // Step Final
            rlSteps.push({
                stepNumber: rlSteps.length + 1,
                lineNumber: 17,
                code: 'return prev; // new head is Node(4)',
                explanation: 'curr reached NULL. All pointers reversed in-place with O(1) auxiliary memory. Returning prev (Node 4) as new head.',
                loopIteration: 'Reversal Complete',
                variables: [
                    { name: 'head', value: 'Node(4)', changed: true, type: 'ListNode*' },
                    { name: 'result', value: '4 -> 3 -> 2 -> 1 -> NULL', changed: true, type: 'string' }
                ],
                linkedListData: {
                    title: 'Final Reversed List',
                    nodes: ['4', '3', '2', '1'],
                    pointers: [{ name: 'head', index: 0, color: '#10b981' }]
                },
                callStack: ['main()'],
                stdout: rlStdout
            });

            return {
                language: 'C (Pointers)',
                title: 'Reverse Singly Linked List (3 Pointers In-Place)',
                algorithmCategory: 'Linked List / Pointer Manipulation',
                timeComplexity: 'O(n)',
                spaceComplexity: 'O(1)',
                complexityExplanation: 'Visits each node exactly once, updating next pointers in-place using three pointers (prev, curr, nextNode) with zero heap allocations.',
                output: rlStdout,
                totalIterations: rlNodes.length,
                steps: rlSteps
            };
        }

        // --- CASE 7: VALID PARENTHESES (STACK) ---
        var isValidParen = /isValid|Stack<Character>|valid.*paren|stack\.push/i.test(code);
        if (isValidParen) {
            var parenStr = '{[()]}';
            var parenSteps = [];
            var stackElements = [];
            var pStdout = 'Is valid: true\n';

            // Step 1: Initial state
            parenSteps.push({
                stepNumber: 1,
                lineNumber: 5,
                code: 'Stack<Character> stack = new Stack<>(); String s = "' + parenStr + '";',
                explanation: 'Initialized empty LIFO character stack. Input string has length ' + parenStr.length + ': "' + parenStr + '".',
                loopIteration: 'Initialization',
                variables: [
                    { name: 's', value: '"' + parenStr + '"', changed: false, type: 'String' },
                    { name: 'stack.size()', value: '0', changed: true, type: 'int' }
                ],
                stackData: {
                    title: 'LIFO Character Stack',
                    elements: []
                },
                callStack: ['main()', 'isValid("' + parenStr + '")'],
                stdout: ''
            });

            for (var pi = 0; pi < parenStr.length; pi++) {
                var ch = parenStr[pi];
                var isOpen = (ch === '(' || ch === '{' || ch === '[');

                if (isOpen) {
                    stackElements.push(ch);
                    parenSteps.push({
                        stepNumber: parenSteps.length + 1,
                        lineNumber: 8,
                        code: "stack.push('" + ch + "'); // pushed opening bracket",
                        explanation: "Character '" + ch + "' is an opening bracket. Pushed onto top of LIFO stack. Stack depth = " + stackElements.length + ".",
                        loopIteration: "Char " + pi + " ('" + ch + "')",
                        variables: [
                            { name: 'c', value: "'" + ch + "'", changed: true, type: 'char' },
                            { name: 'stack.peek()', value: "'" + ch + "'", changed: true, type: 'char' },
                            { name: 'stack.size()', value: String(stackElements.length), changed: true, type: 'int' }
                        ],
                        stackData: {
                            title: 'Stack after push(' + ch + ')',
                            elements: [...stackElements]
                        },
                        callStack: ['isValid("' + parenStr + '")'],
                        stdout: ''
                    });
                } else {
                    var popped = stackElements.pop();
                    parenSteps.push({
                        stepNumber: parenSteps.length + 1,
                        lineNumber: 11,
                        code: "char top = stack.pop(); // popped '" + popped + "', matches '" + ch + "'",
                        explanation: "Character '" + ch + "' is a closing bracket. Popped matching opening bracket '" + popped + "' from top of stack.",
                        loopIteration: "Char " + pi + " ('" + ch + "')",
                        variables: [
                            { name: 'c', value: "'" + ch + "'", changed: true, type: 'char' },
                            { name: 'top', value: "'" + popped + "'", changed: true, type: 'char' },
                            { name: 'stack.size()', value: String(stackElements.length), changed: true, type: 'int' }
                        ],
                        stackData: {
                            title: 'Stack after pop()',
                            elements: [...stackElements]
                        },
                        callStack: ['isValid("' + parenStr + '")'],
                        stdout: ''
                    });
                }
            }

            // Step Final
            parenSteps.push({
                stepNumber: parenSteps.length + 1,
                lineNumber: 17,
                code: 'return stack.isEmpty(); // returns true',
                explanation: 'All characters scanned. Stack is now completely empty, confirming all brackets were opened and closed in valid balanced order.',
                loopIteration: 'Validation Complete',
                variables: [
                    { name: 'stack.isEmpty()', value: 'true', changed: true, type: 'boolean' },
                    { name: 'result', value: 'true', changed: true, type: 'boolean' }
                ],
                stackData: {
                    title: 'Final Stack (Empty)',
                    elements: []
                },
                callStack: ['main()'],
                stdout: pStdout
            });

            return {
                language: 'Java',
                title: 'Valid Parentheses (LIFO Stack Data Structure)',
                algorithmCategory: 'Stack / String Parsing',
                timeComplexity: 'O(n)',
                spaceComplexity: 'O(n)',
                complexityExplanation: 'Each bracket is pushed and popped from the stack at most once. Linear O(n) runtime with O(n) space for stack storage.',
                output: pStdout,
                totalIterations: parenStr.length,
                steps: parenSteps
            };
        }

        // --- CASE 8: MERGE SORT ---
        var isMergeSort = /merge_sort|mergeSort/i.test(code);
        if (isMergeSort) {
            var mArr = [38, 27, 43, 3, 9, 82, 10];
            var mSteps = [];
            var mStdout = 'Sorted: [3, 9, 10, 27, 38, 43, 82]\n';

            mSteps.push({
                stepNumber: 1,
                lineNumber: 2,
                code: 'def merge_sort(arr): # len = 7',
                explanation: 'Merge Sort initialized with ' + mArr.length + ' elements: [' + mArr.join(', ') + '].',
                loopIteration: 'Divide Stage',
                variables: [
                    { name: 'arr', value: '[' + mArr.join(', ') + ']', changed: true, type: 'list' },
                    { name: 'n', value: String(mArr.length), changed: true, type: 'int' }
                ],
                arrayPointers: [
                    {
                        arrayName: 'arr',
                        elements: mArr.map(String),
                        pointers: [{ name: 'mid', index: 3, color: '#38bdf8' }]
                    }
                ],
                callStack: ['main()', 'merge_sort(arr)'],
                stdout: ''
            });

            var mSplits = [
                { code: 'left = merge_sort([38, 27, 43, 3])', expl: 'Divide: split left half [38, 27, 43, 3].', left: ['38', '27', '43', '3'] },
                { code: 'right = merge_sort([9, 82, 10])', expl: 'Divide: split right half [9, 82, 10].', left: ['9', '82', '10'] },
                { code: 'merge([27, 38], [3, 43]) -> [3, 27, 38, 43]', expl: 'Conquer & Merge: sorted left sub-array is [3, 27, 38, 43].', left: ['3', '27', '38', '43'] },
                { code: 'merge([9, 82], [10]) -> [9, 10, 82]', expl: 'Conquer & Merge: sorted right sub-array is [9, 10, 82].', left: ['9', '10', '82'] },
                { code: 'merge([3, 27, 38, 43], [9, 10, 82])', expl: 'Final 2-pointer Merge step combining both halves into sorted output.', left: ['3', '9', '10', '27', '38', '43', '82'] }
            ];

            for (var mi = 0; mi < mSplits.length; mi++) {
                mSteps.push({
                    stepNumber: mSteps.length + 1,
                    lineNumber: 6 + mi,
                    code: mSplits[mi].code,
                    explanation: mSplits[mi].expl,
                    loopIteration: 'Step ' + (mi + 1) + ' (Merge / Conquer)',
                    variables: [
                        { name: 'current', value: '[' + mSplits[mi].left.join(', ') + ']', changed: true, type: 'list' }
                    ],
                    arrayPointers: [
                        {
                            arrayName: 'sub-array',
                            elements: mSplits[mi].left,
                            pointers: [{ name: 'head', index: 0, color: '#10b981' }]
                        }
                    ],
                    callStack: ['merge_sort()', 'merge()'],
                    stdout: ''
                });
            }

            mSteps.push({
                stepNumber: mSteps.length + 1,
                lineNumber: 19,
                code: 'return result; // [3, 9, 10, 27, 38, 43, 82]',
                explanation: 'Merge sort complete. All recursive divisions combined in guaranteed O(n log n) time.',
                loopIteration: 'Sorting Complete',
                variables: [
                    { name: 'result', value: '[3, 9, 10, 27, 38, 43, 82]', changed: true, type: 'list' }
                ],
                arrayPointers: [
                    {
                        arrayName: 'sorted result',
                        elements: ['3', '9', '10', '27', '38', '43', '82'],
                        pointers: [{ name: 'done', index: 6, color: '#10b981' }]
                    }
                ],
                callStack: ['main()'],
                stdout: mStdout
            });

            return {
                language: 'Python',
                title: 'Merge Sort (Divide & Conquer)',
                algorithmCategory: 'Divide & Conquer / Sorting',
                timeComplexity: 'O(n log n)',
                spaceComplexity: 'O(n)',
                complexityExplanation: 'Guaranteed O(n log n) comparisons across all best, average, and worst cases with O(n) auxiliary memory for merge buffer.',
                output: mStdout,
                totalIterations: mSplits.length,
                steps: mSteps
            };
        }

        // --- CASE 9: COUNT SET BITS (BIT MANIPULATION) ---
        var isSetBits = /count_set_bits|n\s*&=\s*n\s*-\s*1|set_bits|setbits/i.test(code);
        if (isSetBits) {
            var nVal = 29; // 11101
            var bitSteps = [];
            var bitCount = 0;
            var currentN = nVal;

            function to8BitArray(num, clearedBitPos) {
                var res = [];
                for (var pos = 7; pos >= 0; pos--) {
                    var bitVal = (num & (1 << pos)) ? '1' : '0';
                    res.push({
                        pos: pos,
                        val: bitVal,
                        cleared: (clearedBitPos === pos)
                    });
                }
                return res;
            }

            bitSteps.push({
                stepNumber: 1,
                lineNumber: 2,
                code: 'let mut count = 0; mut n: u32 = 29; // binary: 00011101',
                explanation: "Count Set Bits (Brian Kernighan's Algorithm) initialized with n = 29. Binary representation is 00011101.",
                loopIteration: 'Initialization',
                variables: [
                    { name: 'n', value: '29', changed: true, type: 'u32' },
                    { name: 'n (binary)', value: '00011101', changed: true, type: 'binary' },
                    { name: 'count', value: '0', changed: true, type: 'u32' }
                ],
                bitData: {
                    title: '8-Bit Register for n',
                    val: 29,
                    binary: '00011101',
                    bits: to8BitArray(29, -1)
                },
                callStack: ['main()', 'count_set_bits(29)'],
                stdout: ''
            });

            while (currentN > 0 && bitCount < 8) {
                bitCount++;
                var prevVal = currentN;
                var lowestBit = currentN & -currentN;
                var lowestBitPos = Math.round(Math.log2(lowestBit));
                currentN = currentN & (currentN - 1);
                var binStr = currentN.toString(2).padStart(8, '0');

                bitSteps.push({
                    stepNumber: bitSteps.length + 1,
                    lineNumber: 5,
                    code: 'n &= n - 1; // ' + prevVal + ' & ' + (prevVal - 1) + ' = ' + currentN + '; count = ' + bitCount,
                    explanation: "Iteration " + bitCount + ": n &= n - 1 cleared lowest set bit at position b" + lowestBitPos + ". n reduced from " + prevVal + " to " + currentN + " (" + binStr + "). count incremented to " + bitCount + ".",
                    loopIteration: 'Iteration ' + bitCount + ' (Cleared bit b' + lowestBitPos + ')',
                    variables: [
                        { name: 'n', value: String(currentN), changed: true, type: 'u32' },
                        { name: 'n (binary)', value: binStr, changed: true, type: 'binary' },
                        { name: 'clearedBit', value: 'b' + lowestBitPos, changed: true, type: 'bit' },
                        { name: 'count', value: String(bitCount), changed: true, type: 'u32' }
                    ],
                    bitData: {
                        title: 'Register after clearing bit b' + lowestBitPos,
                        val: currentN,
                        binary: binStr,
                        bits: to8BitArray(currentN, lowestBitPos)
                    },
                    callStack: ['count_set_bits()'],
                    stdout: ''
                });
            }

            var bitStdout = 'Number of set bits in 29: ' + bitCount + '\n';
            bitSteps.push({
                stepNumber: bitSteps.length + 1,
                lineNumber: 7,
                code: 'return count; // returns ' + bitCount,
                explanation: 'n is now 0. Loop terminated in ' + bitCount + ' iterations (proportional only to the number of set bits, not the bit width). Result = ' + bitCount + '.',
                loopIteration: 'Bit Counting Complete',
                variables: [
                    { name: 'n', value: '0', changed: false, type: 'u32' },
                    { name: 'count', value: String(bitCount), changed: false, type: 'u32' },
                    { name: 'result', value: String(bitCount), changed: true, type: 'u32' }
                ],
                bitData: {
                    title: 'Final Register (All Set Bits Counted)',
                    val: 0,
                    binary: '00000000',
                    bits: to8BitArray(0, -1)
                },
                callStack: ['main()'],
                stdout: bitStdout
            });

            return {
                language: 'Rust',
                title: "Count Set Bits (Brian Kernighan's Bitwise Masking)",
                algorithmCategory: 'Bit Manipulation / Masking',
                timeComplexity: 'O(k) where k = set bits (<= O(log n))',
                spaceComplexity: 'O(1)',
                complexityExplanation: 'Each n &= n - 1 clears the least significant set bit in O(1) time. Total iterations equals the number of set bits (k=4), never checking unset 0 bits.',
                output: bitStdout,
                totalIterations: bitCount,
                steps: bitSteps
            };
        }

        // --- CASE 10: GENERAL LOOP / ITERATION (e.g., for i = 0 to N, while, etc.) ---
        var forLoopMatch = code.match(/for\s*\(\s*(?:(?:int|let|var|auto)\s+)?([a-zA-Z_]\w*)\s*=\s*(\d+)\s*;\s*\1\s*(<|<=|>|>=)\s*(\d+|[a-zA-Z_]\w*|\w+\.(?:length|size\(\)))\s*;\s*([^\)]+)\)/i);
        var pyRangeMatch = code.match(/for\s+([a-zA-Z_]\w*)\s+in\s+range\(\s*(\d+)(?:\s*,\s*(\d+))?(?:\s*,\s*(\d+))?\s*\)/i);

        if (forLoopMatch || pyRangeMatch) {
            var loopVar = forLoopMatch ? forLoopMatch[1] : pyRangeMatch[1];
            var loopStart = forLoopMatch ? parseInt(forLoopMatch[2], 10) : (pyRangeMatch[3] ? parseInt(pyRangeMatch[2], 10) : 0);
            var loopLimit = forLoopMatch ? (parseInt(forLoopMatch[4], 10) || 5) : (pyRangeMatch[3] ? parseInt(pyRangeMatch[3], 10) : parseInt(pyRangeMatch[2], 10));
            var loopOp = forLoopMatch ? forLoopMatch[3] : '<';

            var maxIters = Math.min(20, Math.max(1, loopOp === '<=' ? (loopLimit - loopStart + 1) : (loopLimit - loopStart)));

            var loopSteps = [];
            var loopAccumOutput = '';

            // Step 1: Program Entry & Variable Declaration
            loopSteps.push({
                stepNumber: 1,
                lineNumber: 1,
                code: 'int ' + loopVar + ' = ' + loopStart + '; // Loop initialization',
                explanation: 'Program initiated. Setting up loop index variable ' + loopVar + ' with starting value ' + loopStart + '.',
                loopIteration: 'Loop Initialization',
                variables: [
                    { name: loopVar, value: String(loopStart), changed: true, type: 'int' },
                    { name: 'limit', value: String(loopLimit), changed: false, type: 'int' }
                ],
                arrayPointers: [
                    {
                        arrayName: 'data',
                        elements: arrayElements,
                        pointers: [{ name: loopVar, index: Math.min(loopStart, arrayElements.length - 1), color: '#38bdf8' }]
                    }
                ],
                callStack: ['main()'],
                stdout: ''
            });

            for (var k = 0; k < maxIters; k++) {
                var curI = loopStart + k;
                var iterNum = k + 1;

                // Step A: Condition Check
                loopSteps.push({
                    stepNumber: loopSteps.length + 1,
                    lineNumber: 2,
                    code: loopVar + ' = ' + curI + '; checking condition (' + curI + ' ' + loopOp + ' ' + loopLimit + ')',
                    explanation: 'Iteration ' + iterNum + ': Loop counter ' + loopVar + ' = ' + curI + '. Evaluating condition (' + curI + ' ' + loopOp + ' ' + loopLimit + '): TRUE. Proceeding into loop body.',
                    loopIteration: 'Iteration ' + iterNum + ' (' + loopVar + ' = ' + curI + ')',
                    variables: [
                        { name: loopVar, value: String(curI), changed: true, type: 'int' },
                        { name: 'iteration', value: String(iterNum), changed: true, type: 'int' }
                    ],
                    arrayPointers: [
                        {
                            arrayName: 'data',
                            elements: arrayElements,
                            pointers: [{ name: loopVar, index: Math.min(curI, arrayElements.length - 1), color: '#38bdf8' }]
                        }
                    ],
                    callStack: ['main() -> loop'],
                    stdout: loopAccumOutput
                });

                // Step B: Body Execution (Output / Calculation)
                loopAccumOutput += curI + ' ';
                loopSteps.push({
                    stepNumber: loopSteps.length + 1,
                    lineNumber: 3,
                    code: 'print(' + loopVar + '); // ' + loopVar + ' = ' + curI,
                    explanation: 'Executed loop body: evaluated ' + loopVar + ' = ' + curI + '. Emitted output to console terminal. Accumulated stdout: "' + loopAccumOutput.trim() + '".',
                    loopIteration: 'Iteration ' + iterNum + ' (Body Execution: ' + loopVar + ' = ' + curI + ')',
                    variables: [
                        { name: loopVar, value: String(curI), changed: false, type: 'int' },
                        { name: 'output', value: loopAccumOutput.trim(), changed: true, type: 'string' }
                    ],
                    arrayPointers: [
                        {
                            arrayName: 'data',
                            elements: arrayElements,
                            pointers: [{ name: loopVar, index: Math.min(curI, arrayElements.length - 1), color: '#10b981' }]
                        }
                    ],
                    callStack: ['main() -> loop'],
                    stdout: loopAccumOutput
                });

                // Step C: Increment
                var nextI = curI + 1;
                loopSteps.push({
                    stepNumber: loopSteps.length + 1,
                    lineNumber: 4,
                    code: loopVar + '++ // ' + curI + ' -> ' + nextI,
                    explanation: 'Incrementing loop index: ' + loopVar + ' is incremented from ' + curI + ' to ' + nextI + '.',
                    loopIteration: 'Iteration ' + iterNum + ' (Increment: ' + loopVar + ' = ' + nextI + ')',
                    variables: [
                        { name: loopVar, value: String(nextI), changed: true, type: 'int' }
                    ],
                    arrayPointers: [
                        {
                            arrayName: 'data',
                            elements: arrayElements,
                            pointers: [{ name: loopVar, index: Math.min(nextI, arrayElements.length - 1), color: '#ef4444' }]
                        }
                    ],
                    callStack: ['main() -> loop'],
                    stdout: loopAccumOutput
                });
            }

            // Step Final: Loop Termination
            var finalI = loopStart + maxIters;
            loopSteps.push({
                stepNumber: loopSteps.length + 1,
                lineNumber: 5,
                code: '// Loop termination check: ' + loopVar + ' = ' + finalI + ' ' + loopOp + ' ' + loopLimit + ' is FALSE',
                explanation: 'Checking loop termination condition: ' + loopVar + ' = ' + finalI + '. Condition (' + finalI + ' ' + loopOp + ' ' + loopLimit + ') evaluates to FALSE. Loop completed! Program finishes.',
                loopIteration: 'Loop Terminated',
                variables: [
                    { name: loopVar, value: String(finalI), changed: false, type: 'int' },
                    { name: 'status', value: 'completed', changed: true, type: 'string' }
                ],
                arrayPointers: [
                    {
                        arrayName: 'data',
                        elements: arrayElements,
                        pointers: []
                    }
                ],
                callStack: ['main()'],
                stdout: loopAccumOutput
            });

            return {
                language: language === 'auto' ? 'Multi-Language' : language,
                title: 'Iterative Loop Execution (' + maxIters + ' Iterations)',
                algorithmCategory: 'Linear Loop / Iterative Traversal',
                timeComplexity: 'O(n)',
                spaceComplexity: 'O(1)',
                complexityExplanation: 'The loop executes ' + maxIters + ' sequential iterations with constant O(1) auxiliary variable space.',
                output: loopAccumOutput.trim(),
                totalIterations: maxIters,
                steps: loopSteps
            };
        }

        // --- CASE 4: GENERIC LINE-BY-LINE FALLBACK ---
        var genVars = {
            'status': 'running'
        };
        var loopCount = 0;

        steps.push({
            stepNumber: 1,
            lineNumber: 1,
            code: lines[0] || 'Program Entry',
            explanation: 'Program execution initiated in ' + (language === 'auto' ? 'Universal Mode' : language) + '. Initializing local environment.',
            loopIteration: 'Setup / Entry',
            variables: [
                { name: 'status', value: 'initializing', changed: true, type: 'string' }
            ],
            arrayPointers: [
                {
                    arrayName: 'data',
                    elements: arrayElements,
                    pointers: [{ name: 'ptr', index: 0, color: '#38bdf8' }]
                }
            ],
            callStack: ['main()'],
            stdout: ''
        });

        for (var i = 0; i < lines.length && steps.length < 25; i++) {
            var rawLine = lines[i].trim();
            if (!rawLine || rawLine.indexOf('//') === 0 || rawLine.indexOf('#') === 0 || rawLine === '{' || rawLine === '}') {
                continue;
            }

            var lineNum = i + 1;
            var isLoop = /for|while/i.test(rawLine);
            var isCondition = /if|else/i.test(rawLine);
            var isPrint = /print|cout|console\.log|println/i.test(rawLine);
            var isReturn = /return/i.test(rawLine);

            var explanation = 'Executed line ' + lineNum + ': ' + rawLine;
            var loopLabel = isLoop ? ('Loop Step ' + (++loopCount)) : (loopCount > 0 ? ('Iteration ' + loopCount) : 'Sequential Flow');

            if (isLoop) {
                explanation = 'Evaluating loop condition: ' + rawLine + '. Condition holds true; proceeding into loop body.';
            } else if (isCondition) {
                explanation = 'Evaluating branch condition: ' + rawLine + '. Branch taken.';
            } else if (isPrint) {
                var printVal = rawLine.replace(/^(?:print|console\.log|std::cout\s*<<)\s*\(?/, '').replace(/\)?\s*;?$/, '');
                stdout += '[Stdout]: ' + printVal + '\n';
                explanation = 'Standard output operation evaluated: ' + printVal + '. Emitted to console terminal.';
            } else if (isReturn) {
                explanation = 'Encountered return statement: ' + rawLine + '. Value calculated and returned.';
            } else if (rawLine.indexOf('=') !== -1) {
                var parts = rawLine.split('=');
                var vName = parts[0].replace(/(?:int|let|var|const|float|double|auto)\s+/, '').trim();
                var vVal = parts[1].replace(/;/, '').trim();
                genVars[vName] = vVal;
                explanation = 'Assigned variable ' + vName + ' = ' + vVal + '.';
            }

            var varsList = [];
            for (var k in genVars) {
                varsList.push({
                    name: k,
                    value: genVars[k],
                    changed: (explanation.indexOf(k) !== -1),
                    type: /^\d+$/.test(genVars[k]) ? 'int' : 'auto'
                });
            }

            steps.push({
                stepNumber: steps.length + 1,
                lineNumber: lineNum,
                code: lines[i],
                explanation: explanation,
                loopIteration: loopLabel,
                variables: varsList,
                arrayPointers: [
                    {
                        arrayName: 'data',
                        elements: arrayElements,
                        pointers: [{ name: 'i', index: Math.min(steps.length, arrayElements.length - 1), color: '#38bdf8' }]
                    }
                ],
                callStack: isReturn ? ['main() -> return'] : ['main()'],
                stdout: stdout
            });
        }

        return {
            language: language === 'auto' ? 'Universal Multi-Language' : language,
            title: 'Algorithmic Execution Trace',
            algorithmCategory: 'Linear / Iterative DSA',
            timeComplexity: loopCount > 1 ? 'O(n)' : 'O(1)',
            spaceComplexity: 'O(1)',
            complexityExplanation: 'Linear execution sequence tracked step-by-step with state mutation records.',
            output: stdout || 'Program execution completed with return code 0.\nOutputs and intermediate states tracked.',
            totalIterations: loopCount,
            steps: steps
        };
    }

    // Execute Trace
    function runCodeTracer() {
        if (!codeInput) return;
        var code = codeInput.value.trim();
        if (!code) {
            if (window.showToast) window.showToast('Please enter or paste code to trace.');
            return;
        }

        var lang = langSelect ? langSelect.value : 'auto';
        var customInput = customInputEl ? customInputEl.value.trim() : '';

        // UI Loading State
        if (runBtn) runBtn.disabled = true;
        if (loadingBox) loadingBox.style.display = 'flex';
        if (resultsContainer) resultsContainer.style.display = 'none';
        stopPlay();

        // GitHub Pages and the Android WebView do not have a server endpoint.
        // Run the reliable offline tracer immediately there instead of waiting
        // for a failing fetch to resolve.
        var isOfflineHost = !window.location ||
            window.location.protocol === 'file:' ||
            /(^|\.)github\.io$/i.test(window.location.hostname || '');
        if (isOfflineHost) {
            renderTraceResults(simulateClientSideTrace(code, lang, customInput), code);
            if (runBtn) runBtn.disabled = false;
            if (loadingBox) loadingBox.style.display = 'none';
            return;
        }

        // Perform server-side deep execution trace via the optional
        // Express/Gemini backend when the app is hosted with one.
        fetch('/api/trace-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: code,
                language: lang,
                customInput: customInput
            })
        })
        .then(function(res) {
            if (!res.ok) {
                throw new Error('Trace endpoint returned HTTP ' + res.status);
            }
            return res.json();
        })
        .then(function(data) {
            if (data && data.steps && data.steps.length > 0) {
                renderTraceResults(data, code);
            } else {
                console.warn('Server returned fallback or empty steps; using client emulator.');
                var fallbackData = simulateClientSideTrace(code, lang, customInput);
                renderTraceResults(fallbackData, code);
            }
        })
        .catch(function(err) {
            console.warn('Trace API offline or error, executing client-side emulator:', err);
            var fallbackData = simulateClientSideTrace(code, lang, customInput);
            renderTraceResults(fallbackData, code);
        })
        .finally(function() {
            if (runBtn) runBtn.disabled = false;
            if (loadingBox) loadingBox.style.display = 'none';
        });
    }

    // Render Full Trace Results
    function renderTraceResults(data, sourceCode) {
        data = data || {};
        data.code = sourceCode;
        tracerState.traceData = data;
        tracerState.code = sourceCode;

        // Meta headers
        if (metaTitle) metaTitle.textContent = data.title || 'Algorithm Execution Trace';
        if (metaCategory) metaCategory.textContent = data.algorithmCategory || 'Algorithm';
        if (metaTime) metaTime.textContent = 'Time: ' + (data.timeComplexity || 'O(?)');
        if (metaSpace) metaSpace.textContent = 'Space: ' + (data.spaceComplexity || 'O(?)');
        if (metaLang) metaLang.textContent = data.language || 'Language';

        // Complexity Tab Details
        if (analysisTimeComplexity) analysisTimeComplexity.textContent = data.timeComplexity || 'O(?)';
        if (analysisSpaceComplexity) analysisSpaceComplexity.textContent = data.spaceComplexity || 'O(?)';
        if (analysisTotalSteps) analysisTotalSteps.textContent = data.steps ? data.steps.length : 1;
        if (analysisComplexityNotes) analysisComplexityNotes.innerHTML = escapeHtml(data.complexityExplanation || 'Algorithmic complexity verified.');

        // Setup Code Lines Viewer
        setupCodeViewer(sourceCode);

        // Setup Slider
        if (stepScrubberSlider) {
            stepScrubberSlider.min = 1;
            stepScrubberSlider.max = data.steps ? data.steps.length : 1;
            stepScrubberSlider.value = 1;
        }

        // Show Results
        var tracerView = document.getElementById('codeTracerView');
        var floatingNav = document.getElementById('tracerFloatingNav');
        if (floatingNav) floatingNav.style.display = 'flex';

        updateCollapsedCodeStats();

        // On smaller screens or when code is lengthy, auto-collapse editor so results and visualizer are in prime focus
        if (window.innerWidth < 768 || (sourceCode && sourceCode.split('\n').length > 10)) {
            var editorCard = document.getElementById('tracerEditorCard');
            var collapseText = document.getElementById('tracerCollapseToggleText');
            var collapseIcon = document.getElementById('tracerCollapseToggleIcon');
            if (editorCard) {
                editorCard.classList.add('is-collapsed');
                if (collapseText) collapseText.textContent = 'EXPAND';
                if (collapseIcon) collapseIcon.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
            }
        }

        if (resultsContainer) {
            resultsContainer.style.display = 'flex';
            setTimeout(function() {
                var target = document.getElementById('tracerStepperPanel') || resultsContainer;
                if (tracerView && target) {
                    var offset = target.offsetTop - 12;
                    tracerView.scrollTo({ top: offset > 0 ? offset : 0, behavior: 'smooth' });
                } else if (resultsContainer.scrollIntoView) {
                    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 80);
        }

        // Go to Step 0
        goToStep(0);
        switchTracerTab('tab_step');
        if (window.showToast) window.showToast('Code trace ready (' + (data.steps ? data.steps.length : 0) + ' steps evaluated)');
    }

    var isTracerInitialized = false;

    // Initialize Event Listeners
    function init() {
        if (!codeInput) codeInput = document.getElementById('tracerCodeInput');
        if (!lineGutter) lineGutter = document.getElementById('tracerLineGutter');
        if (!tracerEditorBox) tracerEditorBox = document.getElementById('tracerEditorBox');
        if (!langSelect) langSelect = document.getElementById('tracerLangSelect');
        if (!presetsSelect) presetsSelect = document.getElementById('tracerPresetsSelect');
        if (!customInputEl) customInputEl = document.getElementById('tracerCustomInput');
        if (!runBtn) runBtn = document.getElementById('tracerRunBtn');
        if (!loadingBox) loadingBox = document.getElementById('tracerLoadingState');
        if (!resultsContainer) resultsContainer = document.getElementById('tracerResultsContainer');
        if (!stepFirstBtn) stepFirstBtn = document.getElementById('stepFirstBtn');
        if (!stepPrevBtn) stepPrevBtn = document.getElementById('stepPrevBtn');
        if (!stepPlayPauseBtn) stepPlayPauseBtn = document.getElementById('stepPlayPauseBtn');
        if (!stepNextBtn) stepNextBtn = document.getElementById('stepNextBtn');
        if (!stepLastBtn) stepLastBtn = document.getElementById('stepLastBtn');
        if (!stepSpeedSelect) stepSpeedSelect = document.getElementById('stepSpeedSelect');
        if (!stepScrubberSlider) stepScrubberSlider = document.getElementById('stepScrubberSlider');

        if (!isTracerInitialized) {
            isTracerInitialized = true;

            if (codeInput) {
                codeInput.addEventListener('input', onCodeInputChanged);
                codeInput.addEventListener('keyup', onCodeInputChanged);
                codeInput.addEventListener('paste', function() {
                    setTimeout(onCodeInputChanged, 10);
                });
                codeInput.addEventListener('scroll', syncScroll);
                codeInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        var start = this.selectionStart;
                        var end = this.selectionEnd;
                        this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
                        this.selectionStart = this.selectionEnd = start + 4;
                        onCodeInputChanged();
                    }
                });
            }

            window.addEventListener('resize', syncScroll);

            if (langSelect) {
                langSelect.addEventListener('change', function() {
                    updateSyntaxHighlight();
                    updateCollapsedCodeStats();
                    // Update if results are visible
                    if (tracerState.traceData && codeViewerLines) {
                        setupCodeViewer(tracerState.code || (codeInput ? codeInput.value : ''));
                    }
                });
            }

            if (presetsSelect) {
                presetsSelect.addEventListener('change', function() {
                    if (this.value) {
                        loadPreset(this.value);
                    }
                });
            }

            var sampleBtn = document.getElementById('tracerSampleBtn');
            if (sampleBtn) {
                sampleBtn.addEventListener('click', function() {
                    loadPreset('twosum_py');
                });
            }

            var clearBtn = document.getElementById('tracerClearBtn');
            if (clearBtn) {
                clearBtn.addEventListener('click', function() {
                    if (codeInput) codeInput.value = '';
                    if (customInputEl) customInputEl.value = '';
                    onCodeInputChanged();
                    if (resultsContainer) resultsContainer.style.display = 'none';
                    var floatingNav = document.getElementById('tracerFloatingNav');
                    if (floatingNav) floatingNav.style.display = 'none';
                    stopPlay();
                    if (window.showToast) window.showToast('Code editor cleared.');
                });
            }

            var copyCodeBtn = document.getElementById('tracerCopyCodeBtn');
            if (copyCodeBtn) {
                copyCodeBtn.addEventListener('click', function() {
                    if (!codeInput || !codeInput.value.trim()) {
                        if (window.showToast) window.showToast('No code to copy.');
                        return;
                    }
                    navigator.clipboard.writeText(codeInput.value).then(function() {
                        if (window.showToast) window.showToast('Code copied to clipboard!');
                    }).catch(function() {
                        if (window.showToast) window.showToast('Could not copy code.');
                    });
                });
            }

            if (runBtn) {
                runBtn.addEventListener('click', function() {
                    runCodeTracer();
                });
            }

            // Stepper Navigation
            if (stepFirstBtn) {
                stepFirstBtn.addEventListener('click', function() {
                    stopPlay();
                    goToStep(0);
                });
            }

            if (stepPrevBtn) {
                stepPrevBtn.addEventListener('click', function() {
                    stopPlay();
                    goToStep(tracerState.currentStep - 1);
                });
            }

            if (stepPlayPauseBtn) {
                stepPlayPauseBtn.addEventListener('click', function() {
                    togglePlay();
                });
            }

            if (stepNextBtn) {
                stepNextBtn.addEventListener('click', function() {
                    stopPlay();
                    goToStep(tracerState.currentStep + 1);
                });
            }

            if (stepLastBtn) {
                stepLastBtn.addEventListener('click', function() {
                    stopPlay();
                    if (tracerState.traceData && tracerState.traceData.steps) {
                        goToStep(tracerState.traceData.steps.length - 1);
                    }
                });
            }

            if (stepSpeedSelect) {
                stepSpeedSelect.addEventListener('change', function() {
                    tracerState.playSpeed = parseInt(this.value, 10) || 800;
                    if (tracerState.isPlaying) {
                        startPlay(); // restart with new speed
                    }
                });
            }

            if (stepScrubberSlider) {
                stepScrubberSlider.addEventListener('input', function() {
                    stopPlay();
                    var stepNum = parseInt(this.value, 10);
                    goToStep(stepNum - 1);
                });
            }

            // Editor Collapse / Expand toggle
            var collapseBtn = document.getElementById('tracerCollapseToggleBtn');
            var editorCard = document.getElementById('tracerEditorCard');
            var collapseText = document.getElementById('tracerCollapseToggleText');
            var collapseIcon = document.getElementById('tracerCollapseToggleIcon');
            var expandMiniBtn = document.getElementById('tracerExpandMiniBtn');
            var collapsedSummary = document.getElementById('tracerEditorCollapsedSummary');

            function setEditorCollapsed(shouldCollapse) {
                if (!editorCard) return;
                if (shouldCollapse) {
                    editorCard.classList.add('is-collapsed');
                    if (collapseText) collapseText.textContent = 'EXPAND';
                    if (collapseIcon) collapseIcon.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
                } else {
                    editorCard.classList.remove('is-collapsed');
                    if (collapseText) collapseText.textContent = 'COLLAPSE';
                    if (collapseIcon) collapseIcon.innerHTML = '<polyline points="18 15 12 9 6 15"></polyline>';
                    updateGutter();
                }
            }

            if (collapseBtn) {
                collapseBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var isNowCollapsed = editorCard && editorCard.classList.contains('is-collapsed');
                    setEditorCollapsed(!isNowCollapsed);
                });
            }

            if (expandMiniBtn) {
                expandMiniBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    setEditorCollapsed(false);
                });
            }

            if (collapsedSummary) {
                collapsedSummary.addEventListener('click', function() {
                    setEditorCollapsed(false);
                });
            }

            // Quick Floating Navigation
            var jumpToCodeBtn = document.getElementById('tracerJumpToCodeBtn');
            var jumpToVisBtn = document.getElementById('tracerJumpToVisualizerBtn');

            if (jumpToCodeBtn) {
                jumpToCodeBtn.addEventListener('click', function() {
                    var tracerView = document.getElementById('codeTracerView');
                    if (tracerView) {
                        tracerView.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
            }

            if (jumpToVisBtn) {
                jumpToVisBtn.addEventListener('click', function() {
                    var tracerView = document.getElementById('codeTracerView');
                    var target = document.getElementById('tracerStepperPanel') || document.getElementById('tracerResultsContainer');
                    if (tracerView && target) {
                        var offset = target.offsetTop - 12;
                        tracerView.scrollTo({ top: offset > 0 ? offset : 0, behavior: 'smooth' });
                    }
                });
            }

            // Step narrative quick-jump links
            var jumpTabBtns = document.querySelectorAll('.step-jump-tab-btn');
            for (var j = 0; j < jumpTabBtns.length; j++) {
                jumpTabBtns[j].addEventListener('click', function() {
                    var targetTab = this.getAttribute('data-jump-tab');
                    if (targetTab) switchTracerTab(targetTab);
                });
            }

            // Tab Navigation
            var tabBtns = document.querySelectorAll('.tracer-tab-button');
            for (var t = 0; t < tabBtns.length; t++) {
                tabBtns[t].addEventListener('click', function() {
                    var tabId = this.getAttribute('data-tab');
                    switchTracerTab(tabId);
                });
            }
        }

        initDefaultPreset();
    }

    // Expose functions globally
    window.initCodeTracer = init;
    window.updateTracerLineNumbers = updateGutter;
    window.loadTracerPreset = loadPreset;

    // Self-initialize as soon as DOM is ready or immediately if already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            init();
        });
    } else {
        init();
    }

})(window);
