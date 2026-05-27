const fs = require('fs');
const path = require('path');

// We will download/require marked. Since we don't have it installed in root, we can fetch it or install it.
// To make it dependency-free, let's write a script that installs marked locally in scratch and runs it.
const compile = async () => {
    console.log("Starting compilation...");
    
    // Read markdown
    const mdPath = path.join(__dirname, '..', 'monorepoplan.md');
    if (!fs.existsSync(mdPath)) {
        console.error("monorepoplan.md not found at " + mdPath);
        process.exit(1);
    }
    const mdContent = fs.readFileSync(mdPath, 'utf8');

    // We will use marked via npx/npm or import it. Let's install it programmatically first if not present.
    try {
        require.resolve('marked');
    } catch (e) {
        console.log("marked package not found. Installing marked...");
        const { execSync } = require('child_process');
        execSync('npm install marked --no-save', { cwd: __dirname });
    }

    const { marked } = require('marked');

    // Configure marked to render exactly what we need
    const renderer = new marked.Renderer();

    // 1. Capture code blocks
    renderer.code = function(code, lang, escaped) {
        if (lang === 'mermaid') {
            return `<div class="mermaid bg-slate-900 border border-slate-800 p-4 my-6 rounded-xl overflow-x-auto flex justify-center text-center shadow-lg transition-transform hover:scale-[1.01] duration-300">${code}</div>`;
        }
        
        const langLabel = lang ? `<span class="absolute top-2 right-4 text-[10px] uppercase font-bold tracking-widest text-slate-500">${lang}</span>` : '';
        // We will escape HTML characters to prevent breaking the browser rendering
        const escapedCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        
        return `
            <div class="relative group my-6 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                ${langLabel}
                <button class="copy-btn absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded text-xs" onclick="copyCode(this)">
                    <i class="fa-regular fa-copy"></i>
                </button>
                <pre class="!m-0 !p-5 bg-slate-900 overflow-x-auto font-mono text-[13.5px] leading-relaxed"><code class="hljs language-${lang}">${escapedCode}</code></pre>
            </div>
        `;
    };

    // 2. Parse blockquotes to support GitHub style alerts: [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
    renderer.blockquote = function(quote) {
        const match = quote.match(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
        if (match) {
            const alertType = match[1].toUpperCase();
            const cleanedQuote = quote.replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i, '').trim();
            const iconMap = {
                NOTE: 'info-circle',
                TIP: 'lightbulb',
                IMPORTANT: 'exclamation-circle',
                WARNING: 'triangle-exclamation',
                CAUTION: 'circle-minus'
            };
            const classMap = {
                NOTE: 'alert-note',
                TIP: 'alert-tip',
                IMPORTANT: 'alert-important',
                WARNING: 'alert-warning',
                CAUTION: 'alert-caution'
            };

            return `
                <div class="alert-box ${classMap[alertType]} my-6 shadow-sm border-l-4">
                    <div class="flex items-start space-x-3">
                        <div class="mt-0.5"><i class="fa-solid fa-${iconMap[alertType]} text-lg"></i></div>
                        <div class="flex-1 font-medium text-sm leading-relaxed">${cleanedQuote}</div>
                    </div>
                </div>
            `;
        }
        return `<blockquote class="border-l-4 border-slate-300 dark:border-slate-700 pl-4 py-2 my-6 italic text-slate-600 dark:text-slate-400">${quote}</blockquote>`;
    };

    // 3. Customize list items to render interactive checklists
    let checkboxCounter = 0;
    renderer.listitem = function(text, checked, task) {
        if (task) {
            checkboxCounter++;
            const isChecked = checked ? 'checked' : '';
            const uniqueId = `todo-${checkboxCounter}`;
            const cleanText = text.replace(/<input[^>]*>/, '').trim();
            
            return `
                <li class="list-none flex items-start space-x-3 py-1 text-slate-700 dark:text-slate-300">
                    <div class="flex items-center h-6 mt-0.5">
                        <input type="checkbox" id="${uniqueId}" ${isChecked} data-task="${escapeHtml(cleanText)}"
                            class="task-checkbox h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 cursor-pointer transition">
                    </div>
                    <label for="${uniqueId}" class="cursor-pointer select-none text-[15px] leading-relaxed transition-all hover:text-brand-500 ${checked ? 'line-through text-slate-400 dark:text-slate-500' : ''}">
                        ${cleanText}
                    </label>
                </li>
            `;
        }
        return `<li class="my-1 text-slate-700 dark:text-slate-300">${text}</li>`;
    };

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    marked.setOptions({
        renderer: renderer,
        breaks: true,
        gfm: true
    });

    const htmlBody = marked.parse(mdContent);

    // Template
    const template = `<!DOCTYPE html>
<html lang="vi" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AucoBot — Kế hoạch Monorepo (pnpm)</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        brand: {
                            50: '#eef2ff',
                            100: '#e0e7ff',
                            200: '#c7d2fe',
                            300: '#a5b4fc',
                            400: '#818cf8',
                            500: '#6366f1',
                            600: '#4f46e5',
                            700: '#4338ca',
                            800: '#3730a3',
                            900: '#312e81',
                            950: '#1e1b4b',
                        }
                    },
                    fontFamily: {
                        sans: ['Outfit', 'Inter', 'sans-serif'],
                        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
                    }
                }
            }
        }
    </script>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- Font Awesome -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <!-- Highlight.js (Code Highlighting) -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/tokyo-night-dark.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
    <!-- Mermaid.js (Diagram Rendering) -->
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        /* Glassmorphism custom classes */
        .glass-panel {
            background: rgba(255, 255, 255, 0.75);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.25);
        }
        .dark .glass-panel {
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        /* Custom markdown styling to match Tailwind */
        .prose table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
            font-size: 0.95rem;
        }
        .prose th, .prose td {
            border: 1px solid rgba(156, 163, 175, 0.25);
            padding: 0.75rem 1rem;
            text-align: left;
        }
        .prose th {
            background-color: rgba(99, 102, 241, 0.05);
            font-weight: 600;
        }
        .dark .prose th {
            background-color: rgba(99, 102, 241, 0.15);
        }
        .prose tr:nth-child(even) {
            background-color: rgba(249, 250, 251, 0.5);
        }
        .dark .prose tr:nth-child(even) {
            background-color: rgba(30, 41, 59, 0.2);
        }
        /* Github Alerts */
        .alert-box {
            padding: 1rem;
            margin: 1.5rem 0;
            border-left: 4px solid;
            border-radius: 0.375rem;
        }
        .alert-box p {
            margin: 0 !important;
        }
        .alert-note {
            background-color: rgba(59, 130, 246, 0.05);
            border-color: #3b82f6;
            color: #1d4ed8;
        }
        .dark .alert-note {
            background-color: rgba(59, 130, 246, 0.1);
            color: #93c5fd;
        }
        .alert-tip {
            background-color: rgba(16, 185, 129, 0.05);
            border-color: #10b981;
            color: #047857;
        }
        .dark .alert-tip {
            background-color: rgba(16, 185, 129, 0.1);
            color: #6ee7b7;
        }
        .alert-important {
            background-color: rgba(139, 92, 246, 0.05);
            border-color: #8b5cf6;
            color: #6d28d9;
        }
        .dark .alert-important {
            background-color: rgba(139, 92, 246, 0.1);
            color: #c084fc;
        }
        .alert-warning {
            background-color: rgba(245, 158, 11e, 0.05);
            border-color: #f59e0b;
            color: #b45309;
        }
        .dark .alert-warning {
            background-color: rgba(245, 158, 11e, 0.1);
            color: #fde047;
        }
        .alert-caution {
            background-color: rgba(239, 68, 68, 0.05);
            border-color: #ef4444;
            color: #b91c1c;
        }
        .dark .alert-caution {
            background-color: rgba(239, 68, 68, 0.1);
            color: #fca5a5;
        }
    </style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 min-h-screen transition-colors duration-200 font-sans">

    <!-- Navbar/Header -->
    <header class="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 glass-panel shadow-sm transition-all duration-300">
        <div class="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <!-- Logo / Title -->
                <div class="flex items-center space-x-3">
                    <div class="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                        <i class="fa-solid fa-network-wired text-lg"></i>
                    </div>
                    <div>
                        <span class="font-extrabold text-lg tracking-tight bg-gradient-to-r from-brand-600 to-violet-500 dark:from-brand-400 dark:to-violet-400 bg-clip-text text-transparent">AucoBot</span>
                        <span class="text-xs block text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase">Monorepo Roadmap</span>
                    </div>
                </div>

                <!-- Navigation Controls -->
                <div class="flex items-center space-x-4">
                    <!-- Search Input -->
                    <div class="relative hidden md:block">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <i class="fa-solid fa-magnifying-glass text-slate-400 text-sm"></i>
                        </span>
                        <input type="text" id="search-input" placeholder="Tìm kiếm nội dung..." class="w-64 pl-10 pr-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all placeholder-slate-400">
                    </div>

                    <!-- Theme Toggle -->
                    <button id="theme-toggle" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 focus:outline-none transition-colors">
                        <i class="fa-solid fa-moon text-lg dark:hidden"></i>
                        <i class="fa-solid fa-sun text-lg hidden dark:block"></i>
                    </button>

                    <!-- Reset Progress -->
                    <button id="reset-progress" class="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors">
                        <i class="fa-solid fa-arrows-rotate"></i>
                        <span>Reset Checklist</span>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Workspace Container -->
    <div class="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col lg:flex-row gap-8">
            
            <!-- Left Sidebar: Outline / TOC -->
            <aside class="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                <div class="space-y-6">
                    <div>
                        <h3 class="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 px-3">Mục lục</h3>
                        <nav id="toc" class="space-y-1">
                            <!-- Populated dynamically -->
                        </nav>
                    </div>

                    <!-- Migration Progress Card -->
                    <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Tiến trình di chuyển</h4>
                        <div class="flex justify-between items-baseline mb-2">
                            <span id="progress-percent" class="text-2xl font-extrabold text-brand-600 dark:text-brand-400">0%</span>
                            <span id="progress-ratio" class="text-xs font-medium text-slate-500">0/0 Tasks</span>
                        </div>
                        <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                            <div id="progress-bar" class="bg-gradient-to-r from-brand-500 to-violet-500 h-2 rounded-full transition-all duration-500" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </aside>

            <!-- Main Content Area -->
            <main class="flex-1 min-w-0">
                <article class="prose prose-slate dark:prose-invert max-w-none">
                    <!-- Pre-rendered Static HTML Content -->
                    <div id="content" class="space-y-8 pb-16">
                        ${htmlBody}
                    </div>
                </article>
            </main>

        </div>
    </div>

    <!-- Scroll to top button -->
    <button id="scroll-to-top" class="fixed bottom-6 right-6 p-3 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-lg transition-all duration-300 opacity-0 pointer-events-none hover:scale-110 z-50">
        <i class="fa-solid fa-arrow-up text-lg"></i>
    </button>

    <script>
        // Initialize state
        const state = {
            checklist: {}, // Saves checkbox states: key is task string, value is boolean
        };

        // Theme management
        const setupTheme = () => {
            const toggle = document.getElementById('theme-toggle');
            
            // Check current theme
            if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            toggle.addEventListener('click', () => {
                if (document.documentElement.classList.contains('dark')) {
                    document.documentElement.classList.remove('dark');
                    localStorage.theme = 'light';
                } else {
                    document.documentElement.classList.add('dark');
                    localStorage.theme = 'dark';
                }
                // Reinitialize mermaid since theme changes
                renderDiagrams();
            });
        };

        // Custom function to copy code
        window.copyCode = (button) => {
            const pre = button.nextElementSibling;
            const code = pre.textContent;
            navigator.clipboard.writeText(code).then(() => {
                const icon = button.querySelector('i');
                icon.className = 'fa-solid fa-check text-green-500';
                setTimeout(() => {
                    icon.className = 'fa-regular fa-copy';
                }, 2000);
            });
        };

        // Renders mermaid diagrams using matching mode
        const renderDiagrams = () => {
            const isDark = document.documentElement.classList.contains('dark');
            mermaid.initialize({
                startOnLoad: false,
                theme: isDark ? 'dark' : 'neutral',
                securityLevel: 'loose',
                themeVariables: {
                    fontFamily: 'Outfit, sans-serif',
                    primaryColor: '#6366f1',
                    lineColor: isDark ? '#475569' : '#cbd5e1'
                }
            });
            // Run rendering
            mermaid.run().catch(err => {
                console.error("Mermaid error:", err);
            });
        };

        // Setup headings index / Table of Contents
        const buildTOC = () => {
            const content = document.getElementById('content');
            const toc = document.getElementById('toc');
            const headings = content.querySelectorAll('h2, h3');
            
            if (headings.length === 0) {
                toc.innerHTML = '<span class="text-xs text-slate-400 dark:text-slate-500 pl-3">Không có mục lục</span>';
                return;
            }

            toc.innerHTML = '';
            
            headings.forEach((heading, idx) => {
                const level = heading.tagName.toLowerCase();
                const id = heading.id || \`heading-\${idx}\`;
                heading.id = id;
                
                const link = document.createElement('a');
                link.href = \`#\${id}\`;
                link.textContent = heading.textContent.replace(/#/g, '').trim();
                
                // Active/hover style configurations
                if (level === 'h2') {
                    link.className = 'block px-3 py-1.5 text-sm font-semibold rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900/60 hover:text-brand-600 dark:hover:text-brand-400 transition-all border-l-2 border-transparent';
                } else {
                    link.className = 'block pl-6 pr-3 py-1 text-xs font-medium rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60 hover:text-brand-600 dark:hover:text-brand-400 transition-all border-l-2 border-transparent pl-8';
                }

                // Add active tracking using IntersectionObserver
                toc.appendChild(link);
            });

            // IntersectionObserver setup
            const observerOptions = {
                root: null,
                rootMargin: '-10% 0px -75% 0px',
                threshold: 0
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id;
                        toc.querySelectorAll('a').forEach(a => {
                            if (a.getAttribute('href') === \`#\${id}\`) {
                                a.classList.add('border-brand-500', 'bg-brand-50/50', 'dark:bg-brand-950/20', 'text-brand-600', 'dark:text-brand-400');
                            } else {
                                a.classList.remove('border-brand-500', 'bg-brand-50/50', 'dark:bg-brand-950/20', 'text-brand-600', 'dark:text-brand-400');
                            }
                        });
                    }
                });
            }, observerOptions);

            headings.forEach(heading => observer.observe(heading));
        };

        // Checklist statistics manager
        const updateChecklistStats = () => {
            const checkboxes = document.querySelectorAll('.task-checkbox');
            const total = checkboxes.length;
            if (total === 0) return;

            let checkedCount = 0;
            checkboxes.forEach(cb => {
                const taskKey = cb.getAttribute('data-task');
                if (state.checklist[taskKey]) {
                    cb.checked = true;
                    cb.parentElement.nextElementSibling.classList.add('line-through', 'text-slate-400', 'dark:text-slate-500');
                    checkedCount++;
                } else {
                    cb.checked = false;
                    cb.parentElement.nextElementSibling.classList.remove('line-through', 'text-slate-400', 'dark:text-slate-500');
                }
            });

            const percent = Math.round((checkedCount / total) * 100);
            
            // Update sidebar elements
            document.getElementById('progress-percent').textContent = \`\${percent}%\`;
            document.getElementById('progress-ratio').textContent = \`\${checkedCount}/\${total} Tasks\`;
            document.getElementById('progress-bar').style.width = \`\${percent}%\`;
        };

        // Persistent Checklist Events
        const setupChecklist = () => {
            // Load from localStorage
            const savedChecklist = localStorage.getItem('aucobot_monorepo_checklist');
            if (savedChecklist) {
                try {
                    state.checklist = JSON.parse(savedChecklist);
                } catch (e) {
                    console.error(e);
                }
            }

            // Register checkbox events
            document.addEventListener('change', (e) => {
                if (e.target.classList.contains('task-checkbox')) {
                    const cb = e.target;
                    const taskKey = cb.getAttribute('data-task');
                    const label = cb.parentElement.nextElementSibling;
                    
                    if (cb.checked) {
                        state.checklist[taskKey] = true;
                        label.classList.add('line-through', 'text-slate-400', 'dark:text-slate-500');
                    } else {
                        delete state.checklist[taskKey];
                        label.classList.remove('line-through', 'text-slate-400', 'dark:text-slate-500');
                    }

                    // Save state
                    localStorage.setItem('aucobot_monorepo_checklist', JSON.stringify(state.checklist));
                    updateChecklistStats();
                }
            });

            // Reset checklist button
            const resetBtn = document.getElementById('reset-progress');
            resetBtn.classList.remove('hidden');
            resetBtn.addEventListener('click', () => {
                if (confirm('Bạn có chắc chắn muốn reset lại toàn bộ checklist?')) {
                    state.checklist = {};
                    localStorage.removeItem('aucobot_monorepo_checklist');
                    updateChecklistStats();
                }
            });
        };

        // Scroll to top controller
        const setupScrollToTop = () => {
            const btn = document.getElementById('scroll-to-top');
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    btn.classList.remove('opacity-0', 'pointer-events-none');
                } else {
                    btn.classList.add('opacity-0', 'pointer-events-none');
                }
            });
            btn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        };

        // Live Search implementation
        const setupSearch = () => {
            const searchInput = document.getElementById('search-input');
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                const prose = document.getElementById('content');
                const headings = prose.querySelectorAll('h2, h3, h4');
                const paragraphs = prose.querySelectorAll('p, table tr, li');

                if (!query) {
                    // Reset highlights/hidden elements
                    prose.querySelectorAll('.search-highlight').forEach(el => {
                        el.replaceWith(el.textContent);
                    });
                    prose.querySelectorAll('.hidden-by-search').forEach(el => {
                        el.classList.remove('hidden-by-search', 'opacity-20');
                    });
                    return;
                }

                // Loop and hide/opacity items that do not match query
                headings.forEach(el => {
                    const text = el.textContent.toLowerCase();
                    if (!text.includes(query)) {
                        el.classList.add('hidden-by-search', 'opacity-20');
                    } else {
                        el.classList.remove('hidden-by-search', 'opacity-20');
                    }
                });

                paragraphs.forEach(el => {
                    const text = el.textContent.toLowerCase();
                    if (!text.includes(query)) {
                        el.classList.add('hidden-by-search', 'opacity-20');
                    } else {
                        el.classList.remove('hidden-by-search', 'opacity-20');
                    }
                });
            });
        };

        // Init Highlight.js for code highlights
        const setupHighlight = () => {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        };

        // Render main page
        const init = () => {
            setupTheme();
            setupScrollToTop();
            buildTOC();
            setupChecklist();
            updateChecklistStats();
            renderDiagrams();
            setupSearch();
            setupHighlight();
        };

        document.addEventListener("DOMContentLoaded", init);
    </script>
</body>
</html>`;

    // Save compiled file
    const outputPath = path.join(__dirname, '..', 'monorepoplan.html');
    fs.writeFileSync(outputPath, template, 'utf8');
    console.log("Compilation complete! Static HTML written to " + outputPath);
};

compile();
