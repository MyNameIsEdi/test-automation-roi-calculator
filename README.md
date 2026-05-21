
# Test Automation ROI Calculator 🚀

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![QA Focus](https://img.shields.io/badge/Focus-QA_%26_Automation-green?style=for-the-badge)

A fast, beginner-friendly interactive web tool that helps teams calculate the Return on Investment (ROI) of automating manual tests. Built as a single-file application, it demonstrates reactive programming and modern UI design without complex build steps.

## Quick summary
- **Purpose:** Provide a data-driven tool to help QA teams decide whether a test should be automated based on development time, maintenance overhead, and manual effort saved.
- **Audience:** QA Leads, Test Automation Engineers, manual testers planning their automation strategy, or beginners learning front-end reactivity.

## Repository Structure
- [index.html](index.html) — The core application file. Contains the entire layout (Tailwind CSS), data state, and calculation logic (Alpine.js).
- [README.md](README.md) — Project documentation and setup guide.

## Features & Teaching Points
- Real-time calculations and reactive state management using Alpine.js (`x-model`, `x-text`, `x-for`).
- Modern, responsive UI layout and dynamic styling using Tailwind CSS utility classes.
- Conditional logic and dynamic classes: Automatically changing text colors and recommendations based on the calculated break-even point (ROI).
- Array manipulation: Adding and removing rows dynamically from the data table.
- Zero-build architecture: No Node.js, Webpack, or npm required. Everything runs directly in the browser via CDNs.

## Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge).
- An active internet connection (to load the Tailwind and Alpine CDNs).

## Run the examples
Because this is a static, single-file application, there is no server to start or dependencies to install. 

Open a terminal to clone the repo, then simply open the file in your browser:

```bash
git clone [https://github.com/YOUR-USERNAME/test-automation-roi-calculator.git](https://github.com/YOUR-USERNAME/test-automation-roi-calculator.git)
cd test-automation-roi-calculator

# Open in your default browser:
# On macOS:
open index.html

# On Windows:
start index.html

# On Linux:
xdg-open index.html

```

## Example output (excerpt)

Entering data into the calculator yields instant results. For example:

--- Scenario: Smoke Test (Every PR) ---
Manual time: 5 mins | Frequency: 60/month
Dev time: 4 hours | Maint: 0.2 hours/month

Resulting calculations:
Net Monthly Savings: 4.8 hours
Months to Break-even (ROI): 0.8
Recommendation: Highly Recommended 🔥

## Next steps

* Host this file for free on **GitHub Pages** so your whole team can access it via a URL.
* Try modifying the Alpine.js logic to include financial calculations (e.g., adding an hourly wage variable to calculate money saved).
* Use this single-file pattern as a building block for creating other internal team tools and dashboards.

---

License: MIT (See repository root for terms).

```

```
