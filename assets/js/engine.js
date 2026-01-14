/**
 * Engine.js
 * Core logic for MathFlow. Manages lesson state, user progress, and communication
 * between the visual layer and the UI.
 */

export class LessonEngine {
    constructor() {
        this.currentChapter = 0;
        this.currentLesson = 0;
        this.courseData = null;
        this.state = {};
    }

    async init() {
        try {
            await this.loadCourseData();

            // Wire Global Buttons
            document.getElementById('btn-start-course').addEventListener('click', () => this.startCourse());
            document.getElementById('btn-back-dashboard').addEventListener('click', () => this.backToDashboard());

            // Wire Zen Toggle
            document.getElementById('btn-zen-toggle').addEventListener('click', () => {
                document.querySelector('.split-left').classList.toggle('zen-mode');
            });

            // Wire Modal Buttons
            document.getElementById('btn-modal-replay').addEventListener('click', () => this.hideVictoryModal());
            document.getElementById('btn-modal-next').addEventListener('click', () => this.advanceChapter());

            // Wire Lesson Navigation
            document.getElementById('prev-btn').addEventListener('click', () => this.prevLesson());
            document.getElementById('next-btn').addEventListener('click', () => this.nextLesson());

            // Initial State
            // If data loaded, we can render dashboard now to have it ready
            this.renderDashboard();

            // Start at Home
            this.switchView('home');

        } catch (error) {
            console.error("Failed to load course data:", error);
        }
    }

    async loadCourseData() {
        const response = await fetch('data/course_data.json');
        this.courseData = await response.json();
        console.log("Course loaded:", this.courseData.course_title);
    }

    /**
     * View Router
     * @param {string} viewId - 'home' | 'dashboard' | 'lesson'
     */
    switchView(viewId) {
        // 1. Fade out current
        const currentViewId = this.state.currentView;
        if (currentViewId) {
            const current = document.getElementById(`view-${currentViewId}`);
            if (current) {
                current.classList.remove('visible');
                // Wait for opacity transition to finish before display:none
                setTimeout(() => {
                    current.classList.remove('active');
                }, 300);
            }
        }

        // 2. Fade in target (allow overlap or sequential? Sequential seems safer for simple DOM)
        const target = document.getElementById(`view-${viewId}`);
        if (target) {
            // Immediate block display to prepare for fade in
            target.classList.remove('hidden');
            target.classList.add('active');

            // Small Tick to trigger CSS transition
            setTimeout(() => {
                target.classList.add('visible');
            }, 50);
        }

        this.state.currentView = viewId;
    }

    renderDashboard() {
        const grid = document.getElementById('chapter-grid');
        if (!grid || !this.courseData) return;

        grid.innerHTML = this.courseData.chapters.map((chapter, index) => {
            // Clean Re-design: Topic Tag instead of progress bar
            // Use ID prefixes to guess topic if not explicit
            let topic = "Math";
            if (chapter.id.includes("algebra")) topic = "Algebra";
            if (chapter.id.includes("functions")) topic = "Functions";
            if (chapter.id.includes("graph")) topic = "Graphing";
            if (chapter.id.includes("trig")) topic = "Trigonometry";
            if (chapter.id.includes("calculus") || chapter.id.includes("integration")) topic = "Calculus";

            return `
            <div class="chapter-card" onclick="window.engine.startChapter(${index})">
                <div class="card-icon">
                    ${this.getIconForChapter(chapter.id)}
                </div>
                <div class="card-info">
                    <h3>${chapter.title}</h3>
                    <p>${chapter.lessons.length} Lessons</p>
                    <span class="topic-tag">${topic}</span>
                </div>
            </div>
            `;
        }).join('');
    }

    getIconForChapter(id) {
        // Simple SVG icons mapping
        const icons = {
            'ch1_algebra': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M12 3v18M5 10l7-7 7 7"/></svg>`, // Balance/Scale approx
            'ch2_functions': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6" y2="6" /><line x1="6" y1="18" x2="6" y2="18" /></svg>`, // Machine
            'ch3_graphs': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" /></svg>`, // Graph
            'ch4_trig': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2v20" /><path d="M12 12l7.07-7.07" /></svg>`, // Circle
            'ch5_calculus': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18c0-5 3-9 9-9 5 0 9-4 9-9" /><line x1="10" y1="12" x2="14" y2="6" /></svg>`, // Curve + Tangent
            'ch6_integration': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /><line x1="4" y1="12" x2="20" y2="12" /></svg>`  // Blocks
        };
        return icons[id] || `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
    }

    // Navigation Actions
    startCourse() {
        this.switchView('dashboard');
    }

    startChapter(chapterIndex) {
        this.currentChapter = chapterIndex;
        this.currentLesson = 0;
        this.renderLesson();
        this.switchView('lesson');
    }

    backToDashboard() {
        this.switchView('dashboard');
    }

    renderLesson() {
        // We might want to scroll to top
        const rightSplit = document.getElementById('content-scroll');
        if (rightSplit) rightSplit.scrollTop = 0;

        if (!this.courseData) return;

        const chapter = this.courseData.chapters[this.currentChapter];
        const lesson = chapter.lessons[this.currentLesson];

        // Update Header
        document.querySelector('.course-breadcrumb').textContent = `MathFlow / ${chapter.title} / ${lesson.title}`;

        // Update Progress (Removed bar, but can keep internal logic or simple text if needed)
        // document.getElementById('lesson-progress').style.width = `${progress}%`;

        // Update Navigation
        document.querySelector('.slide-indicator').textContent = `${this.currentLesson + 1} / ${chapter.lessons.length}`;
        document.getElementById('prev-btn').disabled = this.currentLesson === 0;
        document.getElementById('next-btn').disabled = this.currentLesson === chapter.lessons.length - 1;

        // Render Content
        const contentContainer = document.getElementById('lesson-stream');
        contentContainer.innerHTML = `
            <div class="lesson-intro">
                <h1>${lesson.title}</h1>
                <p class="instruction">${lesson.instruction}</p>
                <div class="interaction-area">
                    <!-- Placeholder for specific controls -->
                    <div id="controls-container"></div>
                </div>
                <div class="quiz-container">
                    <h3>${lesson.quiz.question}</h3>
                    <div class="quiz-options">
                        ${lesson.quiz.options.map((opt, idx) => `
                            <button class="quiz-btn" onclick="window.engine.checkAnswer(${idx})">${opt}</button>
                        `).join('')}
                    </div>
                    <div id="quiz-feedback" class="feedback-msg"></div>
                </div>
            </div>
        `;

        // Trigger Visual Update (Event or direct call)
        this.updateVisuals(lesson);
    }

    updateVisuals(lesson) {
        // This will interface with visuals.js
        console.log("Updating visuals for:", lesson.visualType, lesson.interactionConfig);
        if (window.visuals && window.visuals.render) {
            window.visuals.render(lesson.visualType, lesson.interactionConfig);
        }
    }

    checkAnswer(optionIndex) {
        const lesson = this.courseData.chapters[this.currentChapter].lessons[this.currentLesson];
        const feedbackEl = document.getElementById('quiz-feedback');

        let hint = lesson.quiz.failureHints[optionIndex];
        let hintText = "";

        // Handle object-based hints (Phase 4)
        if (typeof hint === 'object' && hint !== null) {
            hintText = hint.text;
            if (hint.highlight && window.visuals && window.visuals.highlightElement) {
                window.visuals.highlightElement(hint.highlight);
            }
        } else {
            hintText = hint || "Incorrect, try again.";
        }

        if (optionIndex === lesson.quiz.correctIndex) {
            feedbackEl.textContent = hintText || "Correct!";
            feedbackEl.className = "feedback-msg correct";

            // UI Polish: Flash the button
            const btns = document.querySelectorAll('.quiz-btn');
            if (btns[optionIndex]) btns[optionIndex].classList.add('correct-flash');

            // UI Polish: Pulse Next Button
            const nextBtn = document.getElementById('next-btn');
            if (nextBtn) {
                nextBtn.classList.add('pulse');
                nextBtn.disabled = false;
            }


        } else {
            feedbackEl.textContent = hintText;
            feedbackEl.className = "feedback-msg incorrect";

            // Reactive Feedback (Scale Tipping / Visual Scenarios)
            const wrongAnswerText = lesson.quiz.options[optionIndex];
            if (window.visuals && window.visuals.showScenario) {
                window.visuals.showScenario(lesson.visualType, wrongAnswerText);
            }
        }
    }

    nextLesson() {
        const chapter = this.courseData.chapters[this.currentChapter];
        if (this.currentLesson < chapter.lessons.length - 1) {
            this.currentLesson++;
            this.renderLesson();
        } else {
            // End of chapter - Show Victory Modal
            this.showVictoryModal();
        }
    }

    showVictoryModal() {
        const modal = document.getElementById('victory-modal');
        if (modal) {
            modal.classList.remove('hidden');
            // Small tick for fade in
            setTimeout(() => modal.classList.add('visible'), 10);
        }
    }

    hideVictoryModal() {
        const modal = document.getElementById('victory-modal');
        if (modal) {
            modal.classList.remove('visible');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
    }

    advanceChapter() {
        this.hideVictoryModal();
        // Go to next chapter if available, else Dashboard
        if (this.currentChapter < this.courseData.chapters.length - 1) {
            this.currentChapter++;
            this.currentLesson = 0;
            this.renderLesson();
        } else {
            // Course Complete
            alert("Course Complete! Returning to Dashboard.");
            this.backToDashboard();
        }
    }

    prevLesson() {
        if (this.currentLesson > 0) {
            this.currentLesson--;
            this.renderLesson();
        }
        // If at start of chapter, do nothing? Or go back to dash?
        // Standard is do nothing/disabled button.
    }
}

// Expose instance for global access (for now, to keep it simple for inline onclicks)
window.engine = new LessonEngine();
