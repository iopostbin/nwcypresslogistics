// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    });
});

// Header background change on scroll
window.addEventListener("scroll", function () {
    const header = document.getElementById("header");
    if (window.scrollY > 100) {
        header.style.background = "rgba(13, 31, 20, 0.98)";
        header.style.backdropFilter = "blur(20px)";
    } else {
        header.style.background = "rgba(13, 31, 20, 0.95)";
        header.style.backdropFilter = "blur(15px)";
    }
});

// Fade in animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
        }
    });
}, observerOptions);

document.querySelectorAll(".fade-in").forEach(function (el) {
    observer.observe(el);
});

// Contact form handling
document
    .getElementById("contact-form")
    .addEventListener("submit", function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        const data = Object.fromEntries(formData);

        const submitButton = this.querySelector(".form-submit");
        const originalText = submitButton.textContent;
        submitButton.textContent = "Sending...";
        submitButton.disabled = true;

        const subject = encodeURIComponent(
            "New Contact Form Submission from " +
            data.firstName +
            " " +
            data.lastName,
        );
        const body = encodeURIComponent(
            "Name: " +
            data.firstName +
            " " +
            data.lastName +
            "\n" +
            "Email: " +
            data.email +
            "\n" +
            "Phone: " +
            (data.phone || "Not provided") +
            "\n\n" +
            "Message:\n" +
            data.message,
        );
        const mailtoUrl =
            "mailto:contact@nwcypresslogistics.com?subject=" +
            subject +
            "&body=" +
            body;

        window.location.href = mailtoUrl;

        setTimeout(function () {
            document.getElementById("success-message").style.display = "block";
            document.getElementById("contact-form").reset();
            submitButton.textContent = originalText;
            submitButton.disabled = false;

            setTimeout(function () {
                document.getElementById("success-message").style.display = "none";
            }, 5000);
        }, 1000);
    });

// Service card hover effects
document.querySelectorAll(".service-card").forEach(function (card) {
    card.addEventListener("mouseenter", function () {
        this.style.background = "linear-gradient(135deg, #4caf50, #2e7d32)";
        this.style.color = "white";
    });

    card.addEventListener("mouseleave", function () {
        this.style.background = "linear-gradient(145deg, #253325, #1a2e1a)";
        this.style.color = "#e8f5e8";
    });
});

// Floating leaf particles
function createLeafParticle() {
    const leaf = document.createElement("div");
    const leafTypes = ["🍃", "🍂", "🌿"];
    leaf.innerHTML =
        leafTypes[Math.floor(Math.random() * leafTypes.length)];
    leaf.style.position = "fixed";
    leaf.style.left = Math.random() * window.innerWidth + "px";
    leaf.style.top = "-50px";
    leaf.style.fontSize = Math.random() * 1.5 + 0.5 + "rem";
    leaf.style.opacity = Math.random() * 0.7 + 0.3;
    leaf.style.pointerEvents = "none";
    leaf.style.zIndex = "1";
    leaf.style.transition = "all 8s linear";

    document.body.appendChild(leaf);

    setTimeout(function () {
        leaf.style.top = window.innerHeight + 50 + "px";
        leaf.style.transform =
            "rotate(360deg) translateX(" + (Math.random() * 200 - 100) + "px)";
    }, 100);

    setTimeout(function () {
        if (document.body.contains(leaf)) {
            document.body.removeChild(leaf);
        }
    }, 8000);
}

setInterval(createLeafParticle, 3000);

// Referral form handling
document.getElementById('referral-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const fd = new FormData(this);
    const d = Object.fromEntries(fd);

    const btn = this.querySelector('.form-submit');
    const orig = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
        const response = await fetch(`${ENV.API_BASE_URL}/api/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(d)
        });
        const result = await response.json();

        if (result.success) {
            document.getElementById('referral-success').style.display = 'block';
            document.getElementById('referral-form').reset();

            setTimeout(function () {
                document.getElementById('referral-success').style.display = 'none';
            }, 6000);
        } else {
            alert('Error generating lead: ' + (result.errors ? result.errors.join(', ') : 'Unknown error'));
        }
    } catch (err) {
        console.error('Lead submit error:', err);
        alert('Failed to connect to the server. Please try again later.');
    } finally {
        btn.textContent = orig;
        btn.disabled = false;
    }
});

// -- Get Your Referral Link form --
function slugify(str) {
    return str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function copyReferralLink() {
    const urlText = document.getElementById('link-url-text').textContent;
    navigator.clipboard.writeText(urlText).then(function () {
        const btn = document.getElementById('btn-copy');
        btn.textContent = '✅ Copied!';
        btn.classList.add('copied');
        setTimeout(function () {
            btn.textContent = '📋 Copy';
            btn.classList.remove('copied');
        }, 2500);
    });
}

document.getElementById('get-link-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const fd = new FormData(this);

    // Map form fields to API payload
    const payload = {
        firstName: fd.get('glFirstName'),
        lastName: fd.get('glLastName'),
        email: fd.get('glEmail'),
        company: fd.get('glCompany'),
        phone: fd.get('glPhone')
    };

    const btn = this.querySelector('.form-submit');
    const orig = btn.textContent;
    btn.textContent = 'Generating...';
    btn.disabled = true;

    try {
        const response = await fetch(`${ENV.API_BASE_URL}/api/referral-link`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            // Show success banner
            document.getElementById('get-link-success').style.display = 'block';
            document.getElementById('get-link-success').innerHTML = '✅ <strong>Thank you for your submission!</strong><br>We’ve generated your referral link and successfully sent a copy to your email address.';

            // Show generated link
            document.getElementById('link-code-text').textContent = data.referralCode;
            document.getElementById('link-url-text').textContent = data.referralUrl;
            document.getElementById('link-result').style.display = 'block';

            document.getElementById('get-link-form').reset();

            setTimeout(function () {
                document.getElementById('get-link-success').style.display = 'none';
            }, 8000);
        } else {
            alert('Error generating link: ' + (data.errors ? data.errors.join(', ') : 'Unknown error'));
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Failed to connect to the server. Please try again later.');
    } finally {
        btn.textContent = orig;
        btn.disabled = false;
    }
});
