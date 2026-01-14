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
            this.renderLesson();
        } catch (error) {
            console.error("Failed to load course data:", error);
        }
    }

    async loadCourseData() {
        const response = await fetch('data/course_data.json');
        this.courseData = await response.json();
        console.log("Course loaded:", this.courseData.course_title);
    }

    renderLesson() {
        if (!this.courseData) return;

        const chapter = this.courseData.chapters[this.currentChapter];
        const lesson = chapter.lessons[this.currentLesson];

        // Update Header
        document.querySelector('.course-breadcrumb').textContent = `MathFlow / ${chapter.title} / ${lesson.title}`;
        
        // Update Progress
        const progress = ((this.currentLesson + 1) / chapter.lessons.length) * 100;
        document.getElementById('lesson-progress').style.width = `${progress}%`;

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
        
        if (optionIndex === lesson.quiz.correctIndex) {
            feedbackEl.textContent = lesson.quiz.failureHints[optionIndex] || "Correct!";
            feedbackEl.className = "feedback-msg correct";
            // Enable next button or auto-advance logic could go here
        } else {
            feedbackEl.textContent = lesson.quiz.failureHints[optionIndex] || "Incorrect, try again.";
            feedbackEl.className = "feedback-msg incorrect";
        }
    }

    nextLesson() {
        const chapter = this.courseData.chapters[this.currentChapter];
        if (this.currentLesson < chapter.lessons.length - 1) {
            this.currentLesson++;
            this.renderLesson();
        }
    }

    prevLesson() {
        if (this.currentLesson > 0) {
            this.currentLesson--;
            this.renderLesson();
        }
    }
}

// Expose instance for global access (for now, to keep it simple for inline onclicks)
window.engine = new LessonEngine();
