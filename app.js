(function() {
    'use strict';

    let questions = [];
    let shuffledQuestions = [];
    let currentIndex = -1;
    let started = false;

    const questionText = document.getElementById('question-text');
    const categoryLabel = document.getElementById('category-label');
    const app = document.getElementById('app');

    // Category color schemes (background gradients)
    const categoryColors = {
        'Relationship & Love': { gradient: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)', text: '#fff' },
        'Values & Beliefs': { gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)', text: '#fff' },
        'Future & Goals': { gradient: 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)', text: '#fff' },
        'Family & Background': { gradient: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)', text: '#fff' },
        'Self & Growth': { gradient: 'linear-gradient(135deg, #ff9800 0%, #ef6c00 100%)', text: '#fff' },
        'Past & Experiences': { gradient: 'linear-gradient(135deg, #00bcd4 0%, #00838f 100%)', text: '#fff' },
        'Emotions & Communication': { gradient: 'linear-gradient(135deg, #f44336 0%, #c62828 100%)', text: '#fff' },
        'Lifestyle & Daily Life': { gradient: 'linear-gradient(135deg, #3f51b5 0%, #283593 100%)', text: '#fff' },
        'Fun & Hypothetical': { gradient: 'linear-gradient(135deg, #ffeb3b 0%, #f9a825 100%)', text: '#333' },
        'Deep & Philosophical': { gradient: 'linear-gradient(135deg, #607d8b 0%, #37474f 100%)', text: '#fff' }
    };

    const defaultColor = { gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', text: '#eee' };

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

    // Apply category colors
    function applyCategory(category) {
        const colors = categoryColors[category] || defaultColor;
        document.body.style.background = colors.gradient;
        document.body.style.color = colors.text;

        if (categoryLabel) {
            categoryLabel.textContent = category || '';
            categoryLabel.style.opacity = category ? '1' : '0';
        }
    }

    // Load questions from YAML file
    async function loadQuestions() {
        try {
            document.body.classList.add('loading');
            const response = await fetch('questions.yml?v=' + Date.now()); // Cache bust
            if (!response.ok) throw new Error('Failed to load questions');

            const yamlText = await response.text();
            const data = jsyaml.load(yamlText);

            // Support both new format (objects with category/question) and old format (strings)
            if (Array.isArray(data)) {
                questions = data.map(item => {
                    if (typeof item === 'string') {
                        return { category: '', question: item };
                    }
                    return { category: item.category || '', question: item.question || item };
                });
            } else if (data.questions) {
                questions = data.questions.map(item => {
                    if (typeof item === 'string') {
                        return { category: '', question: item };
                    }
                    return { category: item.category || '', question: item.question || item };
                });
            } else {
                throw new Error('Invalid questions format');
            }

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

        const current = shuffledQuestions[currentIndex];

        // Apply category styling
        applyCategory(current.category);

        // Trigger animation
        questionText.style.animation = 'none';
        questionText.offsetHeight; // Force reflow
        questionText.style.animation = '';

        if (categoryLabel) {
            categoryLabel.style.animation = 'none';
            categoryLabel.offsetHeight;
            categoryLabel.style.animation = '';
        }

        questionText.textContent = current.question;
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
