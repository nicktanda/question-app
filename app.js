(function() {
    'use strict';

    let questions = [];
    let shuffledQuestions = [];
    let currentIndex = -1;
    let started = false;

    const questionText = document.getElementById('question-text');
    const app = document.getElementById('app');

    // Use crypto API for better randomness
    function secureRandom() {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] / (0xFFFFFFFF + 1);
    }

    // Fisher-Yates shuffle with cryptographic randomness
    function shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(secureRandom() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Load questions from YAML file
    async function loadQuestions() {
        try {
            document.body.classList.add('loading');
            const response = await fetch('questions.yml');
            if (!response.ok) throw new Error('Failed to load questions');

            const yamlText = await response.text();
            const data = jsyaml.load(yamlText);

            // Support both array format and {questions: [...]} format
            questions = Array.isArray(data) ? data : (data.questions || []);

            if (questions.length === 0) {
                throw new Error('No questions found');
            }

            document.body.classList.remove('loading');

        } catch (error) {
            document.body.classList.add('error');
            questionText.textContent = `Error: ${error.message}`;
            console.error(error);
        }
    }

    // Show next question
    function nextQuestion() {
        if (questions.length === 0) return;

        if (!started) {
            // First tap - shuffle and start
            shuffledQuestions = shuffle(questions);
            currentIndex = 0;
            started = true;
        } else {
            currentIndex++;
            // If we've gone through all questions, reshuffle
            if (currentIndex >= shuffledQuestions.length) {
                shuffledQuestions = shuffle(questions);
                currentIndex = 0;
            }
        }

        // Trigger animation
        questionText.style.animation = 'none';
        questionText.offsetHeight; // Force reflow
        questionText.style.animation = '';

        questionText.textContent = shuffledQuestions[currentIndex];
    }

    // Handle tap/click anywhere
    app.addEventListener('click', nextQuestion);

    // Also handle touch for mobile
    app.addEventListener('touchend', function(e) {
        e.preventDefault();
        nextQuestion();
    });

    // Prevent double-tap zoom on mobile
    let lastTap = 0;
    app.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTap < 300) {
            e.preventDefault();
        }
        lastTap = now;
    }, { passive: false });

    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .catch(err => console.log('SW registration failed:', err));
    }

    // Initialize
    loadQuestions();
})();
