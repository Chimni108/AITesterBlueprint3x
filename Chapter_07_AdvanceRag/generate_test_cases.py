"""
Generates testcase/vwo_test_cases.csv — 5,000 JIRA-style QA test case rows
covering VWO's product surface (experimentation, personalization, analytics,
mobile SDKs, platform/billing, etc).

Deterministic (seeded) so re-running reproduces the same file. Rows are built
from (module x feature x test_type) combinations; once that space is
exhausted, the generator does additional passes tagged with a browser/device/
locale variant so rows stay unique and realistic (cross-browser regression
suites legitimately repeat the same scenario per environment).

Run:
    python generate_test_cases.py
"""

import csv
import random
from datetime import date, timedelta

random.seed(42)

TOTAL_ROWS = 5000
OUTPUT_PATH = "testcase/vwo_test_cases.csv"
JIRA_KEY_START = 1001  # first row is VWO-1001

# ---------------------------------------------------------------------------
# Product surface: 20 modules x 10 features = 200 base pairs
# ---------------------------------------------------------------------------

MODULES = {
    "Visual Editor": [
        "element text editing", "image swap", "CSS style override",
        "element visibility toggle", "drag-and-drop reorder",
        "custom JavaScript injection", "device preview toggle",
        "editor autosave", "undo/redo history",
        "element selection via CSS selector",
    ],
    "Split URL Testing": [
        "traffic split configuration", "redirect rule creation",
        "URL pattern matching", "query parameter preservation",
        "goal mapping", "variation weight adjustment",
        "campaign pause/resume", "URL exclusion rules",
        "redirect loop detection", "SSL redirect handling",
    ],
    "Server-Side Testing": [
        "SDK initialization", "variation assignment API",
        "feature flag evaluation", "context targeting rules",
        "bucketing consistency", "server SDK caching",
        "fallback variation handling", "multi-environment config sync",
        "SDK error logging", "webhook event delivery",
    ],
    "Multivariate Testing": [
        "section/variation matrix setup", "combination exclusion rules",
        "full factorial design", "partial factorial design",
        "interaction effect reporting", "section weight configuration",
        "MVT preview mode", "combination winner declaration",
        "traffic allocation across combinations", "MVT goal attribution",
    ],
    "Personalization": [
        "audience-based content swap", "rule priority ordering",
        "personalization preview", "dynamic content injection",
        "recommendation widget rendering", "segment-based targeting",
        "personalization fallback content", "real-time rule evaluation",
        "personalization campaign scheduling",
        "cross-device personalization consistency",
    ],
    "Audience Targeting and Segmentation": [
        "geo-targeting rule", "device-based segmentation",
        "behavioral segment creation", "custom JS-based segment",
        "first-time vs returning visitor targeting",
        "UTM parameter targeting", "cookie-based segment persistence",
        "segment size estimation", "nested segment logic (AND/OR)",
        "segment export/import",
    ],
    "Goals and Conversion Tracking": [
        "revenue goal tracking", "pageview goal", "click goal",
        "custom event goal", "funnel goal configuration",
        "goal attribution window", "multi-currency revenue tracking",
        "goal deduplication", "cross-domain goal tracking",
        "engagement time goal",
    ],
    "Reporting and Analytics": [
        "real-time report rendering", "statistical significance calculation",
        "confidence interval display", "segment-wise report breakdown",
        "report export to CSV/PDF", "date range filter",
        "funnel drop-off visualization", "report data refresh latency",
        "sample ratio mismatch detection", "custom report dashboard",
    ],
    "Heatmaps and Session Recordings": [
        "click heatmap capture", "scroll depth heatmap",
        "session recording playback", "recording filter by segment",
        "heatmap overlay on live page", "rage click detection",
        "mobile heatmap capture", "recording privacy masking",
        "heatmap data export", "recording storage retention policy",
    ],
    "SmartCode and Integrations": [
        "SmartCode installation verification", "async snippet loading",
        "flicker-free page load", "Google Analytics integration sync",
        "Segment.com event forwarding", "Shopify app integration",
        "WordPress plugin integration", "GTM container deployment",
        "third-party pixel firing order", "SmartCode version upgrade",
    ],
    "Feature Flags and Rollouts": [
        "flag creation and toggling", "percentage rollout ramp-up",
        "kill switch activation", "environment-specific flag state",
        "flag dependency chaining", "scheduled flag rollout",
        "flag audit log", "stale flag detection",
        "flag targeting rule override", "flag rollback",
    ],
    "Mobile App AB Testing SDK": [
        "iOS SDK integration", "Android SDK integration",
        "React Native bridge test", "offline caching of variations",
        "app version targeting", "push notification AB test",
        "in-app message variation", "SDK crash reporting hook",
        "cold start performance impact", "SDK background sync",
    ],
    "Account and User Management": [
        "user invite flow", "role-based access control",
        "SSO login via SAML", "two-factor authentication",
        "team workspace switching", "audit log export",
        "API key generation", "password reset flow",
        "session timeout handling", "user deactivation",
    ],
    "Billing and Subscription": [
        "plan upgrade flow", "plan downgrade flow", "invoice generation",
        "payment method update", "usage-based overage billing",
        "proration calculation", "coupon code application",
        "billing alert notification", "trial expiration handling",
        "tax calculation by region",
    ],
    "API Platform": [
        "REST API authentication", "rate limiting",
        "webhook signature verification", "pagination handling",
        "API versioning backward compatibility",
        "bulk data export endpoint", "API error response format",
        "idempotency key handling", "GraphQL query resolution",
        "API sandbox environment",
    ],
    "Push Notifications": [
        "push campaign creation", "device token registration",
        "notification AB variant delivery", "deep link handling on tap",
        "notification scheduling by timezone",
        "opt-out/unsubscribe handling", "rich media push rendering",
        "delivery receipt tracking", "quiet hours enforcement",
        "notification throttling",
    ],
    "Web Personalization Widgets": [
        "recommendation carousel rendering", "countdown timer widget",
        "social proof notification widget", "exit-intent popup trigger",
        "sticky bar widget", "widget mobile responsiveness",
        "widget AB variant swap", "widget load performance",
        "widget accessibility ARIA support",
        "widget close/dismiss persistence",
    ],
    "Campaign Scheduling": [
        "start/end date scheduling", "timezone-aware activation",
        "recurring campaign schedule", "campaign draft/publish workflow",
        "campaign archive/restore", "scheduled campaign conflict detection",
        "campaign cloning", "campaign approval workflow",
        "campaign pause on error threshold", "campaign changelog history",
    ],
    "Statistical Engine": [
        "Bayesian probability-to-be-best calculation",
        "frequentist p-value calculation", "sample size calculator",
        "sequential testing correction",
        "minimum detectable effect estimation", "novelty effect warning",
        "multiple comparison correction", "early stopping rule",
        "variance reduction using CUPED", "outlier data exclusion",
    ],
    "Notifications and Alerts": [
        "email alert on significance reached", "Slack integration alert",
        "anomaly detection alert", "weekly summary digest email",
        "alert threshold configuration", "alert mute/snooze",
        "in-app notification bell", "alert escalation policy",
        "webhook alert delivery", "alert history log",
    ],
}

TEST_TYPES = [
    "Positive", "Negative", "Boundary", "Security", "Performance",
    "Usability", "Regression", "Smoke", "Compatibility", "Accessibility",
    "Integration",
]

VARIANTS = [
    "Chrome (Desktop, Windows 11)", "Firefox (Desktop, macOS)",
    "Safari (Desktop, macOS)", "Edge (Desktop, Windows 11)",
    "Chrome (Android 14)", "Safari (iOS 18)",
    "Samsung Internet (Android)", "iPad Safari (iPadOS)",
    "Low-bandwidth 3G network", "RTL locale (Arabic, ar-SA)",
]

REPORTERS = [
    "Priya Sharma", "Daniel Ortiz", "Wei Zhang", "Fatima Al-Sayed",
    "Liam O'Connor", "Aiko Tanaka", "Carlos Mendes", "Grace Okafor",
    "Nikhil Rao", "Sofia Rossi", "Marcus Lee", "Elena Petrova",
]
ASSIGNEES = REPORTERS  # same pool; QA team wears both hats

PRIORITIES = ["Highest", "High", "Medium", "Low", "Lowest"]
DEFAULT_PRIORITY_WEIGHTS = [10, 30, 40, 15, 5]
PRIORITY_WEIGHT_OVERRIDES = {
    "Security": [35, 40, 20, 4, 1],
    "Smoke": [55, 35, 8, 1, 1],
    "Regression": [15, 40, 35, 8, 2],
    "Usability": [2, 13, 40, 35, 10],
    "Accessibility": [5, 20, 45, 25, 5],
}

STATUSES = ["Done", "In Progress", "To Do", "Blocked", "Deprecated"]
STATUS_WEIGHTS = [60, 15, 15, 7, 3]

START_DATE = date(2024, 1, 1)
END_DATE = date(2026, 7, 12)
DATE_SPAN_DAYS = (END_DATE - START_DATE).days


def cap(s: str) -> str:
    return s[0].upper() + s[1:] if s else s


def slugify(s: str) -> str:
    return s.lower().replace(" ", "-").replace("/", "-").replace("(", "").replace(")", "")


def random_date() -> str:
    d = START_DATE + timedelta(days=random.randint(0, DATE_SPAN_DAYS))
    return d.isoformat()


def sprint_for(created: str) -> str:
    y, m, _ = created.split("-")
    return f"VWO {y}.{m}"


# ---------------------------------------------------------------------------
# Per-test-type content builders. Each returns
# (title, preconditions, steps: list[str], expected, extra_tag)
# ---------------------------------------------------------------------------

def build_positive(module, feature):
    title = f"Verify {feature} functions correctly in {module} under valid conditions"
    preconditions = (
        f"User has an active VWO account with edit access to a live project "
        f"configured for {module}."
    )
    steps = [
        "Log in to the VWO dashboard with a valid account.",
        f"Navigate to {module} and open the configuration for {feature}.",
        f"Enter valid, supported values for {feature}.",
        "Save the configuration and publish/activate it.",
        "Trigger the scenario on the target page or app and observe the behavior.",
    ]
    expected = (
        f"{cap(feature)} behaves exactly as configured, with no errors logged in "
        f"the browser console or VWO dashboard, and the change is reflected in real time."
    )
    return title, preconditions, steps, expected, "happy-path"


def build_negative(module, feature):
    title = f"Verify {module} handles invalid input gracefully for {feature}"
    preconditions = f"User has edit access to {module} with {feature} available to configure."
    steps = [
        "Log in to the VWO dashboard with a valid account.",
        f"Navigate to {module} and open the configuration for {feature}.",
        f"Submit invalid or malformed values for {feature} (empty required fields, "
        f"out-of-range numbers, unsupported characters).",
        "Attempt to save the configuration.",
    ]
    expected = (
        "The system rejects the invalid input with a clear inline validation message, "
        "does not persist a broken configuration, and does not throw an unhandled exception."
    )
    return title, preconditions, steps, expected, "negative"


def build_boundary(module, feature):
    title = f"Verify {feature} at minimum and maximum allowed limits in {module}"
    preconditions = f"Documented min/max limits for {feature} are available from product spec."
    steps = [
        "Log in to the VWO dashboard with a valid account.",
        f"Navigate to {module} and locate the {feature} setting.",
        "Set the value to the documented minimum allowed limit and save.",
        "Repeat with the documented maximum allowed limit.",
        "Attempt one unit beyond each limit.",
    ]
    expected = (
        "Values at the minimum and maximum limits are accepted and applied correctly; "
        "values beyond the limits are rejected with an appropriate error message."
    )
    return title, preconditions, steps, expected, "boundary"


def build_security(module, feature):
    title = f"Verify {feature} in {module} is not vulnerable to injection or unauthorized access"
    preconditions = "Tester has both a low-privilege account and API tooling (e.g. Postman/curl)."
    steps = [
        "Log in with a low-privilege user account.",
        f"Attempt to access or modify {feature} directly via API/URL manipulation "
        f"without the required role.",
        f"Submit script tags, SQL-like payloads, and oversized payloads into "
        f"{feature} input fields.",
        "Inspect network requests for sensitive data exposure (API keys, tokens, PII).",
    ]
    expected = (
        "Unauthorized access attempts are blocked with a 401/403 response, injected "
        "payloads are sanitized/escaped and never executed or persisted verbatim, and "
        "no sensitive data is exposed in responses."
    )
    return title, preconditions, steps, expected, "security"


def build_performance(module, feature):
    title = f"Verify {feature} in {module} performs within acceptable thresholds under load"
    preconditions = "Load-testing tool (e.g. k6/JMeter) is available and pointed at a staging project."
    steps = [
        f"Configure {feature} with a realistic production-scale dataset "
        f"(e.g. high-traffic campaign or large audience segment).",
        "Measure page/API response time for the associated action.",
        "Repeat the measurement under concurrent load (e.g. 100 simulated concurrent users).",
    ]
    expected = (
        f"{cap(feature)} completes within the agreed SLA (e.g. under 200ms for API calls, "
        f"under 2s for page render), with no memory leaks or degraded performance under "
        f"sustained load."
    )
    return title, preconditions, steps, expected, "performance"


def build_usability(module, feature):
    title = f"Verify {feature} in {module} is intuitive and provides clear guidance"
    preconditions = "Tester has no prior training on this feature and is given only the task, not the docs."
    steps = [
        f"Open the configuration screen for {feature} as a first-time user.",
        "Attempt to complete the primary task without consulting external documentation.",
        "Note any confusing labels, missing tooltips, or unclear error states.",
    ]
    expected = (
        f"A new user can complete the {feature} task without external help; tooltips or "
        f"help text are present for non-obvious fields, and error states clearly explain "
        f"the corrective action."
    )
    return title, preconditions, steps, expected, "usability"


def build_regression(module, feature):
    title = f"Regression check: {feature} in {module} continues to work after the latest release"
    preconditions = "A last-known-good baseline (screenshot/recording) exists for this scenario."
    steps = [
        f"Re-run the original functional test steps for {feature} against the latest build.",
        "Compare the observed behavior against the last known-good baseline.",
        "Check the bug tracker for previously fixed defects in this area.",
    ]
    expected = (
        f"{cap(feature)} behaves identically to the last known-good baseline; no "
        f"previously fixed defects have resurfaced."
    )
    return title, preconditions, steps, expected, "regression"


def build_smoke(module, feature):
    title = f"Smoke test: {feature} in {module} is available and operational after deployment"
    preconditions = "Latest build has just been deployed to the target environment."
    steps = [
        "Deploy the latest build to the staging/production environment.",
        f"Open {module} and confirm {feature} loads without errors.",
        "Perform one critical happy-path action end to end.",
    ]
    expected = (
        f"{module} loads successfully, {feature} is reachable, and the critical "
        f"happy-path action completes without a blocking error."
    )
    return title, preconditions, steps, expected, "smoke"


def build_compatibility(module, feature):
    title = f"Verify {feature} in {module} renders and functions consistently across supported browsers and devices"
    preconditions = "Access to the supported browser/device test matrix (BrowserStack or equivalent)."
    steps = [
        f"Configure {feature} once in {module}.",
        "Open the resulting experience across the supported browser/device matrix.",
        "Compare rendering, interaction, and console errors across each environment.",
    ]
    expected = (
        f"{cap(feature)} renders and behaves consistently across all supported "
        f"browsers/devices, with no environment-specific console errors or visual regressions."
    )
    return title, preconditions, steps, expected, "compatibility"


def build_accessibility(module, feature):
    title = f"Verify {feature} in {module} meets WCAG 2.1 AA accessibility requirements"
    preconditions = "Screen reader (NVDA/VoiceOver) and an automated audit tool (axe-core) are available."
    steps = [
        f"Navigate to {feature} using keyboard-only navigation.",
        "Run an automated accessibility audit against the page.",
        "Verify the screen reader announces labels, roles, and state changes correctly.",
    ]
    expected = (
        f"{cap(feature)} is fully operable via keyboard, has no critical or serious "
        f"automated accessibility violations, and screen readers announce all "
        f"interactive elements correctly."
    )
    return title, preconditions, steps, expected, "accessibility"


def build_integration(module, feature):
    title = f"Verify {feature} in {module} integrates correctly with connected third-party or internal systems"
    preconditions = "A connected downstream system (GA, Segment, Slack, or a test webhook endpoint) is configured."
    steps = [
        f"Configure {feature} together with its dependent integration.",
        "Trigger the action that should propagate data to the connected system.",
        "Verify the data arrives correctly and in the expected format/timing on the receiving side.",
    ]
    expected = (
        "Data flows correctly end-to-end to the connected system with the expected "
        "schema, without duplication, loss, or excessive delay."
    )
    return title, preconditions, steps, expected, "integration"


BUILDERS = {
    "Positive": build_positive,
    "Negative": build_negative,
    "Boundary": build_boundary,
    "Security": build_security,
    "Performance": build_performance,
    "Usability": build_usability,
    "Regression": build_regression,
    "Smoke": build_smoke,
    "Compatibility": build_compatibility,
    "Accessibility": build_accessibility,
    "Integration": build_integration,
}


def weighted_priority(test_type: str) -> str:
    weights = PRIORITY_WEIGHT_OVERRIDES.get(test_type, DEFAULT_PRIORITY_WEIGHTS)
    return random.choices(PRIORITIES, weights=weights, k=1)[0]


def build_row(row_id: int, module: str, feature: str, test_type: str, variant: str | None) -> dict:
    title, preconditions, steps, expected, extra_tag = BUILDERS[test_type](module, feature)

    if variant:
        title = f"{title} - {variant}"
        preconditions = f"{preconditions} Test environment/context: {variant}."
        steps = steps + [f"Repeat the scenario specifically on: {variant}."]

    numbered_steps = "\n".join(f"{i}. {s}" for i, s in enumerate(steps, start=1))

    created = random_date()
    tags = ", ".join([slugify(module), test_type.lower(), extra_tag])

    return {
        "id": row_id,
        "jira_id": f"VWO-{JIRA_KEY_START + row_id - 1}",
        "issue_type": "Test",
        "title": title,
        "priority": weighted_priority(test_type),
        "status": random.choices(STATUSES, weights=STATUS_WEIGHTS, k=1)[0],
        "module": module,
        "test_type": test_type,
        "tags": tags,
        "preconditions": preconditions,
        "steps": numbered_steps,
        "expected": expected,
        "reporter": random.choice(REPORTERS),
        "assignee": random.choice(ASSIGNEES),
        "created": created,
        "sprint": sprint_for(created),
    }


def main():
    base_combos = [
        (module, feature, test_type)
        for module, features in MODULES.items()
        for feature in features
        for test_type in TEST_TYPES
    ]
    n_base = len(base_combos)  # 20 * 10 * 11 = 2200

    rows = []
    for i in range(TOTAL_ROWS):
        row_id = i + 1
        if i < n_base:
            module, feature, test_type = base_combos[i]
            variant = None
        elif i < 2 * n_base:
            k = i - n_base
            module, feature, test_type = base_combos[k]
            variant = VARIANTS[k % len(VARIANTS)]
        else:
            k = i - 2 * n_base
            module, feature, test_type = base_combos[k % n_base]
            variant = VARIANTS[(k + 3) % len(VARIANTS)]

        rows.append(build_row(row_id, module, feature, test_type, variant))

    fieldnames = [
        "id", "jira_id", "issue_type", "title", "priority", "status", "module",
        "test_type", "tags", "preconditions", "steps", "expected", "reporter",
        "assignee", "created", "sprint",
    ]

    with open(OUTPUT_PATH, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    titles = {r["title"] for r in rows}
    print(f"Wrote {len(rows)} rows to {OUTPUT_PATH}")
    print(f"Unique titles: {len(titles)}")
    print(f"Unique jira_id: {len({r['jira_id'] for r in rows})}")


if __name__ == "__main__":
    main()
