// This script handles form submissions for login, signup, and support using fetch.
// It prevents page reloads and provides a smoother user experience.

document.addEventListener('DOMContentLoaded', () => {
    // Helper function to handle form submissions
    const handleFormSubmit = async (form, url, onSuccess) => {
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const errorMessageEl = form.querySelector('.error-message');
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton ? submitButton.textContent : '';

            // Clear previous errors and disable button
            if (errorMessageEl) errorMessageEl.textContent = '';
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Processing...';
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await res.json();

                if (result.success) {
                    onSuccess(result, form);
                } else {
                    if (errorMessageEl) {
                        errorMessageEl.textContent = result.message || 'An error occurred.';
                        errorMessageEl.style.display = 'block';
                    } else {
                        console.error(result.message || 'An error occurred.');
                    }
                }
            } catch (err) {
                console.error(`Form submission error for ${url}:`, err);
                if (errorMessageEl) {
                    errorMessageEl.textContent = 'A network error occurred. Please try again.';
                    errorMessageEl.style.display = 'block';
                } else {
                    console.error('A network error occurred. Please try again.');
                }
            } finally {
                // Re-enable button
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            }
        });
    };

    // --- Login Form ---
    const loginForm = document.getElementById('login-form');
    handleFormSubmit(loginForm, '/login', (result) => {
        // On successful login, redirect the user
        window.location.href = result.redirectUrl;
    });

    // --- Signup Form ---
    const signupForm = document.getElementById('signup-form');
    handleFormSubmit(signupForm, '/signup', (result) => {
        // On successful signup, redirect the user to the login page
        window.location.href = result.redirectUrl;
    });

    // --- Support Form ---
    // Note: Assumes the support form posts to '/support'
    const supportForm = document.getElementById('support-form');
    handleFormSubmit(supportForm, '/support', (result, form) => {
        // On successful submission, log the message and clear the form
        console.log(result.message);
        form.reset();
    });
});