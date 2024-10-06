(function() {
    function updateDeviceClass() {
        const body = document.body;
        // Remove any previously added class
        body.classList.remove('phone', 'tablet', 'desktop');

        // Check the width of the viewport to determine the device
        const width = window.innerWidth;

        if (width <= 768) {
            // Phone (typically <= 768px)
            body.classList.add('phone');
        } else if (width <= 1024) {
            // Tablet (typically 769px to 1024px)
            body.classList.add('tablet');
        } else {
            // Desktop (anything greater than 1024px)
            body.classList.add('desktop');
        }
    }

    // Call the function initially to set the class when the page loads
    updateDeviceClass();

    // Also update the class whenever the window is resized
    window.addEventListener('resize', updateDeviceClass);
})();