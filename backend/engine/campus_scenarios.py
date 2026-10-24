"""
VNR VJIET Campus Scenario Profiles
Models specialized institutional events requested by the campus network administrator:
- Tech Fest (Convergence / Sintillashunz)
- Online Examination (Autonomous / TCS iON Lockdown)
- First-Year Induction Program (Auditorium & H&S Orientation)
- Standard Academic Working Day
"""

CAMPUS_EVENT_SCENARIOS = {
    "normal_academic": {
        "id": "normal_academic",
        "name": "Standard Academic Working Day",
        "tagline": "Regular lab sessions, classroom theory, faculty research, and library queries",
        "description": "Balanced academic load distributed across all engineering blocks. Lab machines authenticated; standard quota limits enforced.",
        "target_blocks": ["BLOCK_A", "BLOCK_B", "BLOCK_C", "BLOCK_D", "BLOCK_E", "BLOCK_PG"],
        "base_offered_mbps": 85.0,
        "security_posture": "Standard 802.1X Authentication",
        "guest_policy": "Registration required; throttled to 10 Mbps",
        "block_weight_multipliers": {
            "BLOCK_A": 1.0,
            "BLOCK_B": 1.0,
            "BLOCK_C": 1.2,
            "BLOCK_D": 0.8,
            "BLOCK_E": 0.9,
            "BLOCK_PG": 0.8,
            "WIFI_MESH": 0.8
        },
        "badge_color": "emerald"
    },
    "tech_fest": {
        "id": "tech_fest",
        "name": "Annual Tech Fest (Convergence / Sintillashunz)",
        "tagline": "Massive visitor influx, hackathons, coding challenges, and live event streaming",
        "description": "High external visitor traffic. Huge Wi-Fi demand across C-Block (Labs), E-Block (Auditorium events), and open campus Wi-Fi. Captive portal queues new guest requests with automatic guest shaping.",
        "target_blocks": ["BLOCK_C", "BLOCK_E", "WIFI_MESH"],
        "base_offered_mbps": 260.0,
        "security_posture": "Open Captive Portal with Rate Limiting",
        "guest_policy": "Guests permitted with 15 Mbps cap; auto-quarantine on rogue ARP",
        "block_weight_multipliers": {
            "BLOCK_A": 0.6,
            "BLOCK_B": 1.1,
            "BLOCK_C": 2.2,
            "BLOCK_D": 0.7,
            "BLOCK_E": 2.0,
            "BLOCK_PG": 1.2,
            "WIFI_MESH": 2.8
        },
        "badge_color": "cyan"
    },
    "online_exams": {
        "id": "online_exams",
        "name": "Autonomous Online Examinations (Exam Lockdown)",
        "tagline": "Zero tolerance for downtime; high-security isolation for exam halls and servers",
        "description": "High-security lockdown mode. Strict priority bandwidth reserved for Block A (Examination Branch Server) and Block C (Online Exam Labs). Unauthorized / guest Wi-Fi in exam zones is immediately blocked/quarantined to prevent malpractice.",
        "target_blocks": ["BLOCK_A", "BLOCK_C"],
        "base_offered_mbps": 140.0,
        "security_posture": "High-Security Strict MAC Lockdown & VLAN Isolation",
        "guest_policy": "NO unauthorized devices permitted; guest Wi-Fi in exam blocks disabled",
        "block_weight_multipliers": {
            "BLOCK_A": 2.5,
            "BLOCK_B": 0.4,
            "BLOCK_C": 2.2,
            "BLOCK_D": 0.3,
            "BLOCK_E": 0.3,
            "BLOCK_PG": 0.4,
            "WIFI_MESH": 0.2
        },
        "badge_color": "rose"
    },
    "induction_program": {
        "id": "induction_program",
        "name": "First-Year Induction & Orientation Program",
        "tagline": "Parent & student welcome orientation at K.S. Auditorium and H&S Block",
        "description": "High influx of new first-year students and parents centered around Block E (Central Auditorium & H&S Department). Temporary guest passes issued through the welcome onboarding portal.",
        "target_blocks": ["BLOCK_E", "WIFI_MESH"],
        "base_offered_mbps": 180.0,
        "security_posture": "Guest Onboarding Portal Active",
        "guest_policy": "Temporary 1-day guest passes granted with web-only access",
        "block_weight_multipliers": {
            "BLOCK_A": 1.2,
            "BLOCK_B": 0.6,
            "BLOCK_C": 0.8,
            "BLOCK_D": 0.5,
            "BLOCK_E": 3.0,
            "BLOCK_PG": 0.6,
            "WIFI_MESH": 2.2
        },
        "badge_color": "amber"
    }
}
