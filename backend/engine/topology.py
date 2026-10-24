"""
VNR VJIET Campus Network Topology Model
Hierarchical campus infrastructure modeling:
- Core Layer: Campus Core Gateway Router (R_CORE) & Core 10G Backbone Switch (SW_CORE)
- Block Aggregation Layer: Blocks A, B, C, D, E, PG, Central Library, and Campus Wi-Fi Mesh
- Department Distribution Layer: CSE, IT, ECE, EEE, EIE, Civil, Mech, Auto, H&S, PG Research, Exam Branch
- Access Layer: Lab workstations, server clusters, ERP portals, and student/guest BYOD endpoints.
"""

import copy

VNR_BLOCKS = {
    "BLOCK_A": {
        "id": "BLOCK_A",
        "name": "A-Block (Patrons Bhavan - Administration & Examination)",
        "departments": ["Examination Branch", "Administration / ERP", "Accounts & Finance", "Principal Office"],
        "switch_id": "SW_BLOCK_A",
        "default_limit_mbps": 120.0,
        "vlan": "VLAN 100",
        "subnet": "10.100.0.0/20"
    },
    "BLOCK_B": {
        "id": "BLOCK_B",
        "name": "B-Block (Electrical & Specialized Computing)",
        "departments": ["Electrical & Electronics Engineering (EEE)", "CSE - AI & ML / Data Science", "IoT & Cyber Security Lab"],
        "switch_id": "SW_BLOCK_B",
        "default_limit_mbps": 150.0,
        "vlan": "VLAN 200",
        "subnet": "10.200.0.0/20"
    },
    "BLOCK_C": {
        "id": "BLOCK_C",
        "name": "C-Block (Computing Labs & Central Library)",
        "departments": ["Computer Science & Engineering (CSE)", "Information Technology (IT)", "Electronics & Instrumentation (EIE)", "Central Digital Library"],
        "switch_id": "SW_BLOCK_C",
        "default_limit_mbps": 220.0,
        "vlan": "VLAN 300",
        "subnet": "10.300.0.0/20"
    },
    "BLOCK_D": {
        "id": "BLOCK_D",
        "name": "D-Block (Yogaiah Naidu Bhavan - Core Engineering)",
        "departments": ["Mechanical Engineering (MEC)", "Civil Engineering (CIV)", "Automobile Engineering (AUT)"],
        "switch_id": "SW_BLOCK_D",
        "default_limit_mbps": 100.0,
        "vlan": "VLAN 400",
        "subnet": "10.400.0.0/20"
    },
    "BLOCK_E": {
        "id": "BLOCK_E",
        "name": "E-Block (Humanities & Sciences, Central Auditorium)",
        "departments": ["Humanities & Sciences (H&S - 1st Year)", "K.S. Central Auditorium / Induction Hall", "CAE Research Cell"],
        "switch_id": "SW_BLOCK_E",
        "default_limit_mbps": 130.0,
        "vlan": "VLAN 500",
        "subnet": "10.500.0.0/20"
    },
    "BLOCK_PG": {
        "id": "BLOCK_PG",
        "name": "PG-Block (Postgraduate, R&D & Incubation Hub)",
        "departments": ["M.Tech Advanced Computing", "MCA Resource Lab", "VNR Innovation & Startup Incubation Hub"],
        "switch_id": "SW_BLOCK_PG",
        "default_limit_mbps": 90.0,
        "vlan": "VLAN 600",
        "subnet": "10.600.0.0/20"
    },
    "WIFI_MESH": {
        "id": "WIFI_MESH",
        "name": "Campus Student & Guest Wi-Fi Mesh",
        "departments": ["Hostel Laptops Cluster", "Campus BYOD Smartphones", "Guest / Visitor Onboarding Portal"],
        "switch_id": "AP_CAMPUS_WIFI",
        "default_limit_mbps": 80.0,
        "vlan": "VLAN 700",
        "subnet": "10.700.0.0/20"
    }
}

DEFAULT_TOPOLOGY = {
    "nodes": [
        # Core Layer
        {"id": "R_CORE", "label": "VNR Central Core Gateway Router", "type": "router", "layer": "core", "ip": "10.0.0.1", "subnet": "10.0.0.0/16", "x": 500, "y": 50},
        {"id": "SW_CORE", "label": "Campus 10G Backbone Switch (802.1Q)", "type": "switch", "layer": "core", "ip": "10.0.0.2", "vlan": "All Trunks", "x": 500, "y": 140},

        # Block Aggregation Switches (A, B, C, D, E, PG, Wi-Fi)
        {"id": "SW_BLOCK_A", "label": "A-Block Aggregation (Admin & Exam)", "type": "switch", "layer": "distribution", "ip": "10.100.0.1", "block_id": "BLOCK_A", "dept": "Administration & Exam", "x": 90, "y": 260},
        {"id": "SW_BLOCK_B", "label": "B-Block Aggregation (EEE & AI/ML)", "type": "switch", "layer": "distribution", "ip": "10.200.0.1", "block_id": "BLOCK_B", "dept": "EEE & Specialized Computing", "x": 225, "y": 260},
        {"id": "SW_BLOCK_C", "label": "C-Block Aggregation (CSE, IT, Lib)", "type": "switch", "layer": "distribution", "ip": "10.300.0.1", "block_id": "BLOCK_C", "dept": "CSE, IT & Library", "x": 365, "y": 260},
        {"id": "SW_BLOCK_D", "label": "D-Block Aggregation (Mech, Civil, Auto)", "type": "switch", "layer": "distribution", "ip": "10.400.0.1", "block_id": "BLOCK_D", "dept": "Core Engineering", "x": 505, "y": 260},
        {"id": "SW_BLOCK_E", "label": "E-Block Aggregation (H&S, Auditorium)", "type": "switch", "layer": "distribution", "ip": "10.500.0.1", "block_id": "BLOCK_E", "dept": "H&S & Auditorium", "x": 645, "y": 260},
        {"id": "SW_BLOCK_PG", "label": "PG-Block Aggregation (M.Tech, R&D)", "type": "switch", "layer": "distribution", "ip": "10.600.0.1", "block_id": "BLOCK_PG", "dept": "PG & Innovation Center", "x": 785, "y": 260},
        {"id": "AP_CAMPUS_WIFI", "label": "Campus Wi-Fi & Guest Gateway", "type": "access_point", "layer": "distribution", "ip": "10.700.0.1", "block_id": "WIFI_MESH", "dept": "Student & Guest Wi-Fi", "x": 925, "y": 260},

        # Access Layer Nodes per Block
        # Block A (Admin & Exams)
        {"id": "H_ADM_EXAM", "label": "Autonomous Exam Server", "type": "server", "layer": "access", "ip": "10.100.1.10", "block_id": "BLOCK_A", "dept": "Examination Branch", "switch_id": "SW_BLOCK_A", "x": 60, "y": 420},
        {"id": "H_ADM_ERP", "label": "College ERP / Student Portal", "type": "server", "layer": "access", "ip": "10.100.1.20", "block_id": "BLOCK_A", "dept": "Administration / ERP", "switch_id": "SW_BLOCK_A", "x": 120, "y": 420},

        # Block B (EEE & AI/ML)
        {"id": "H_B_AIML", "label": "AI/ML GPU Workstation Lab", "type": "host", "layer": "access", "ip": "10.200.1.15", "block_id": "BLOCK_B", "dept": "CSE - AI & ML", "switch_id": "SW_BLOCK_B", "x": 200, "y": 420},
        {"id": "H_B_EEE", "label": "Power Systems & IoT Research", "type": "host", "layer": "access", "ip": "10.200.1.25", "block_id": "BLOCK_B", "dept": "EEE", "switch_id": "SW_BLOCK_B", "x": 255, "y": 420},

        # Block C (CSE, IT, Library)
        {"id": "H_C_CSE", "label": "CSE High-Performance Lab 1", "type": "host", "layer": "access", "ip": "10.300.1.10", "block_id": "BLOCK_C", "dept": "CSE", "switch_id": "SW_BLOCK_C", "x": 335, "y": 420},
        {"id": "H_C_IT", "label": "IT Cloud & Full-Stack Lab", "type": "host", "layer": "access", "ip": "10.300.1.20", "block_id": "BLOCK_C", "dept": "IT", "switch_id": "SW_BLOCK_C", "x": 395, "y": 420},

        # Block D (Mech, Civil, Auto)
        {"id": "H_D_CAD", "label": "CAD/CAM Robotics Workstation", "type": "host", "layer": "access", "ip": "10.400.1.10", "block_id": "BLOCK_D", "dept": "Mechanical", "switch_id": "SW_BLOCK_D", "x": 475, "y": 420},
        {"id": "H_D_CIVIL", "label": "Civil Geotech / Survey Node", "type": "host", "layer": "access", "ip": "10.400.1.20", "block_id": "BLOCK_D", "dept": "Civil", "switch_id": "SW_BLOCK_D", "x": 535, "y": 420},

        # Block E (H&S, Auditorium)
        {"id": "H_E_AUD", "label": "Auditorium AV Streaming Node", "type": "host", "layer": "access", "ip": "10.500.1.10", "block_id": "BLOCK_E", "dept": "Central Auditorium", "switch_id": "SW_BLOCK_E", "x": 615, "y": 420},
        {"id": "H_E_HS", "label": "1st Year Computing Section", "type": "host", "layer": "access", "ip": "10.500.1.20", "block_id": "BLOCK_E", "dept": "Humanities & Sciences", "switch_id": "SW_BLOCK_E", "x": 675, "y": 420},

        # Block PG (M.Tech & Incubation)
        {"id": "H_PG_RES", "label": "M.Tech Deep Learning Cluster", "type": "host", "layer": "access", "ip": "10.600.1.10", "block_id": "BLOCK_PG", "dept": "M.Tech Research", "switch_id": "SW_BLOCK_PG", "x": 755, "y": 420},
        {"id": "H_PG_STARTUP", "label": "Incubation Startup Gateway", "type": "host", "layer": "access", "ip": "10.600.1.20", "block_id": "BLOCK_PG", "dept": "Innovation Hub", "switch_id": "SW_BLOCK_PG", "x": 815, "y": 420},

        # Campus Wi-Fi & Guest Devices
        {"id": "H_WIFI_STU", "label": "Student Hostel Laptops", "type": "host", "layer": "access", "ip": "10.700.1.50", "block_id": "WIFI_MESH", "dept": "Hostels Wi-Fi", "switch_id": "AP_CAMPUS_WIFI", "x": 895, "y": 420},
        {"id": "H_WIFI_GUEST", "label": "External Guest Devices (TechFest)", "type": "host", "layer": "access", "ip": "10.700.1.99", "block_id": "WIFI_MESH", "dept": "Guest Portal", "switch_id": "AP_CAMPUS_WIFI", "x": 955, "y": 420},
    ],
    "links": [
        # Core Backbone Link
        {
            "id": "L_CORE_BB",
            "name": "Central Core Router ↔ 10G Backbone Switch",
            "source": "R_CORE",
            "target": "SW_CORE",
            "block_id": "CORE",
            "capacity_mbps": 1000.0,
            "propagation_delay_ms": 1.0,
            "max_queue_packets": 250,
            "offered_mbps": 0.0,
            "admitted_mbps": 0.0,
            "transmitted_mbps": 0.0,
            "dropped_mbps": 0.0,
            "utilization_pct": 0.0,
            "current_queue_packets": 0,
            "queue_occupancy_pct": 0.0,
            "packet_drops": 0,
            "latency_ms": 1.0,
            "status": "normal",
            "traffic_control_active": False
        },
        # Block Trunk Distribution Links
        {
            "id": "L_CORE_BLKA",
            "name": "Core Switch ↔ A-Block (Admin & Exam)",
            "source": "SW_CORE",
            "target": "SW_BLOCK_A",
            "block_id": "BLOCK_A",
            "capacity_mbps": 120.0,
            "propagation_delay_ms": 2.5,
            "max_queue_packets": 90,
            "offered_mbps": 0.0,
            "admitted_mbps": 0.0,
            "transmitted_mbps": 0.0,
            "dropped_mbps": 0.0,
            "utilization_pct": 0.0,
            "current_queue_packets": 0,
            "queue_occupancy_pct": 0.0,
            "packet_drops": 0,
            "latency_ms": 2.5,
            "status": "normal",
            "traffic_control_active": False
        },
        {
            "id": "L_CORE_BLKB",
            "name": "Core Switch ↔ B-Block (EEE & AI/ML)",
            "source": "SW_CORE",
            "target": "SW_BLOCK_B",
            "block_id": "BLOCK_B",
            "capacity_mbps": 150.0,
            "propagation_delay_ms": 3.0,
            "max_queue_packets": 100,
            "offered_mbps": 0.0,
            "admitted_mbps": 0.0,
            "transmitted_mbps": 0.0,
            "dropped_mbps": 0.0,
            "utilization_pct": 0.0,
            "current_queue_packets": 0,
            "queue_occupancy_pct": 0.0,
            "packet_drops": 0,
            "latency_ms": 3.0,
            "status": "normal",
            "traffic_control_active": False
        },
        {
            "id": "L_CORE_BLKC",
            "name": "Core Switch ↔ C-Block (CSE, IT, Library)",
            "source": "SW_CORE",
            "target": "SW_BLOCK_C",
            "block_id": "BLOCK_C",
            "capacity_mbps": 220.0,
            "propagation_delay_ms": 2.8,
            "max_queue_packets": 120,
            "offered_mbps": 0.0,
            "admitted_mbps": 0.0,
            "transmitted_mbps": 0.0,
            "dropped_mbps": 0.0,
            "utilization_pct": 0.0,
            "current_queue_packets": 0,
            "queue_occupancy_pct": 0.0,
            "packet_drops": 0,
            "latency_ms": 2.8,
            "status": "normal",
            "traffic_control_active": False
        },
        {
            "id": "L_CORE_BLKD",
            "name": "Core Switch ↔ D-Block (Mech, Civil, Auto)",
            "source": "SW_CORE",
            "target": "SW_BLOCK_D",
            "block_id": "BLOCK_D",
            "capacity_mbps": 100.0,
            "propagation_delay_ms": 3.5,
            "max_queue_packets": 80,
            "offered_mbps": 0.0,
            "admitted_mbps": 0.0,
            "transmitted_mbps": 0.0,
            "dropped_mbps": 0.0,
            "utilization_pct": 0.0,
            "current_queue_packets": 0,
            "queue_occupancy_pct": 0.0,
            "packet_drops": 0,
            "latency_ms": 3.5,
            "status": "normal",
            "traffic_control_active": False
        },
        {
            "id": "L_CORE_BLKE",
            "name": "Core Switch ↔ E-Block (H&S, Auditorium)",
            "source": "SW_CORE",
            "target": "SW_BLOCK_E",
            "block_id": "BLOCK_E",
            "capacity_mbps": 130.0,
            "propagation_delay_ms": 4.0,
            "max_queue_packets": 90,
            "offered_mbps": 0.0,
            "admitted_mbps": 0.0,
            "transmitted_mbps": 0.0,
            "dropped_mbps": 0.0,
            "utilization_pct": 0.0,
            "current_queue_packets": 0,
            "queue_occupancy_pct": 0.0,
            "packet_drops": 0,
            "latency_ms": 4.0,
            "status": "normal",
            "traffic_control_active": False
        },
        {
            "id": "L_CORE_BLKPG",
            "name": "Core Switch ↔ PG-Block (M.Tech, R&D Hub)",
            "source": "SW_CORE",
            "target": "SW_BLOCK_PG",
            "block_id": "BLOCK_PG",
            "capacity_mbps": 90.0,
            "propagation_delay_ms": 3.2,
            "max_queue_packets": 70,
            "offered_mbps": 0.0,
            "admitted_mbps": 0.0,
            "transmitted_mbps": 0.0,
            "dropped_mbps": 0.0,
            "utilization_pct": 0.0,
            "current_queue_packets": 0,
            "queue_occupancy_pct": 0.0,
            "packet_drops": 0,
            "latency_ms": 3.2,
            "status": "normal",
            "traffic_control_active": False
        },
        {
            "id": "L_CORE_WIFI",
            "name": "Core Switch ↔ Campus Wi-Fi & Guest Gateway",
            "source": "SW_CORE",
            "target": "AP_CAMPUS_WIFI",
            "block_id": "WIFI_MESH",
            "capacity_mbps": 80.0,
            "propagation_delay_ms": 6.0,
            "max_queue_packets": 75,
            "offered_mbps": 0.0,
            "admitted_mbps": 0.0,
            "transmitted_mbps": 0.0,
            "dropped_mbps": 0.0,
            "utilization_pct": 0.0,
            "current_queue_packets": 0,
            "queue_occupancy_pct": 0.0,
            "packet_drops": 0,
            "latency_ms": 6.0,
            "status": "normal",
            "traffic_control_active": False
        },
        # Access Links to Department Nodes
        {"id": "L_A_EXAM", "name": "A-Block SW ↔ Exam Server", "source": "SW_BLOCK_A", "target": "H_ADM_EXAM", "block_id": "BLOCK_A", "capacity_mbps": 100.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_A_ERP", "name": "A-Block SW ↔ ERP Portal", "source": "SW_BLOCK_A", "target": "H_ADM_ERP", "block_id": "BLOCK_A", "capacity_mbps": 100.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_B_AIML", "name": "B-Block SW ↔ AI/ML GPU Lab", "source": "SW_BLOCK_B", "target": "H_B_AIML", "block_id": "BLOCK_B", "capacity_mbps": 100.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_B_EEE", "name": "B-Block SW ↔ EEE Power Lab", "source": "SW_BLOCK_B", "target": "H_B_EEE", "block_id": "BLOCK_B", "capacity_mbps": 100.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_C_CSE", "name": "C-Block SW ↔ CSE Lab 1", "source": "SW_BLOCK_C", "target": "H_C_CSE", "block_id": "BLOCK_C", "capacity_mbps": 100.0, "propagation_delay_ms": 1.0, "max_queue_packets": 50, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_C_IT", "name": "C-Block SW ↔ IT Cloud Lab", "source": "SW_BLOCK_C", "target": "H_C_IT", "block_id": "BLOCK_C", "capacity_mbps": 100.0, "propagation_delay_ms": 1.0, "max_queue_packets": 50, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_D_CAD", "name": "D-Block SW ↔ CAD/CAM Lab", "source": "SW_BLOCK_D", "target": "H_D_CAD", "block_id": "BLOCK_D", "capacity_mbps": 100.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_D_CIVIL", "name": "D-Block SW ↔ Civil Survey", "source": "SW_BLOCK_D", "target": "H_D_CIVIL", "block_id": "BLOCK_D", "capacity_mbps": 100.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_E_AUD", "name": "E-Block SW ↔ Auditorium AV", "source": "SW_BLOCK_E", "target": "H_E_AUD", "block_id": "BLOCK_E", "capacity_mbps": 100.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_E_HS", "name": "E-Block SW ↔ H&S Lab", "source": "SW_BLOCK_E", "target": "H_E_HS", "block_id": "BLOCK_E", "capacity_mbps": 100.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_PG_RES", "name": "PG-Block SW ↔ M.Tech Lab", "source": "SW_BLOCK_PG", "target": "H_PG_RES", "block_id": "BLOCK_PG", "capacity_mbps": 100.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_PG_STARTUP", "name": "PG-Block SW ↔ Startup Hub", "source": "SW_BLOCK_PG", "target": "H_PG_STARTUP", "block_id": "BLOCK_PG", "capacity_mbps": 100.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_WIFI_STU", "name": "Wi-Fi AP ↔ Hostel Laptops", "source": "AP_CAMPUS_WIFI", "target": "H_WIFI_STU", "block_id": "WIFI_MESH", "capacity_mbps": 50.0, "propagation_delay_ms": 4.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 4.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_WIFI_GUEST", "name": "Wi-Fi AP ↔ Guest Portal", "source": "AP_CAMPUS_WIFI", "target": "H_WIFI_GUEST", "block_id": "WIFI_MESH", "capacity_mbps": 40.0, "propagation_delay_ms": 5.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 5.0, "status": "normal", "traffic_control_active": False},
    ]
}


class CampusTopology:
    """Manages VNR VJIET campus topology state, blocks, and link operations."""

    def __init__(self):
        self.block_configs = copy.deepcopy(VNR_BLOCKS)
        self.reset_to_defaults()

    def reset_to_defaults(self):
        """Resets topology to baseline default VNR campus network."""
        self.nodes = copy.deepcopy(DEFAULT_TOPOLOGY["nodes"])
        self.links = copy.deepcopy(DEFAULT_TOPOLOGY["links"])
        self.block_configs = copy.deepcopy(VNR_BLOCKS)

    def get_topology(self):
        """Returns nodes, links, and block configurations."""
        return {
            "nodes": self.nodes,
            "links": self.links,
            "blocks": self.block_configs
        }

    def get_blocks_summary(self):
        """Aggregates telemetry per VNR VJIET Block (A, B, C, D, E, PG, Wi-Fi)."""
        summary = {}
        for b_id, b_meta in self.block_configs.items():
            b_links = [l for l in self.links if l.get("block_id") == b_id]
            trunk_link = next((l for l in b_links if l["id"].startswith("L_CORE_")), None)

            offered = sum(l["offered_mbps"] for l in b_links)
            transmitted = sum(l["transmitted_mbps"] for l in b_links)
            dropped = sum(l["dropped_mbps"] for l in b_links)
            limit = b_meta.get("default_limit_mbps", 100.0)

            # Quota breach evaluation
            trunk_load = trunk_link["transmitted_mbps"] if trunk_link else transmitted
            breach_pct = (trunk_load / limit * 100.0) if limit > 0 else 0.0
            
            if breach_pct >= 100.0 or (trunk_link and trunk_link["status"] == "critical"):
                quota_status = "breached"
            elif breach_pct >= 80.0 or (trunk_link and trunk_link["status"] == "warning"):
                quota_status = "warning"
            else:
                quota_status = "within_limit"

            summary[b_id] = {
                "block_id": b_id,
                "name": b_meta["name"],
                "departments": b_meta["departments"],
                "switch_id": b_meta["switch_id"],
                "vlan": b_meta["vlan"],
                "subnet": b_meta["subnet"],
                "bandwidth_limit_mbps": limit,
                "current_load_mbps": round(trunk_load, 2),
                "total_offered_mbps": round(offered, 2),
                "total_transmitted_mbps": round(transmitted, 2),
                "total_dropped_mbps": round(dropped, 2),
                "quota_utilization_pct": round(breach_pct, 1),
                "quota_status": quota_status,
                "trunk_status": trunk_link["status"] if trunk_link else "normal"
            }
        return summary

    def update_block_limit(self, block_id, new_limit_mbps):
        """Configures bandwidth limit threshold for a campus block."""
        if block_id not in self.block_configs:
            return False, f"Block {block_id} not found"
        try:
            val = float(new_limit_mbps)
            if val <= 5.0 or val > 1000.0:
                return False, "Limit must be between 5.0 Mbps and 1000.0 Mbps"
            self.block_configs[block_id]["default_limit_mbps"] = round(val, 2)
            # Update trunk link capacity to match or scale
            trunk_link = next((l for l in self.links if l.get("block_id") == block_id and l["id"].startswith("L_CORE_")), None)
            if trunk_link:
                trunk_link["capacity_mbps"] = round(val, 2)
            return True, f"Bandwidth limit for {block_id} updated to {val} Mbps"
        except (ValueError, TypeError):
            return False, "Invalid numeric limit format"

    def get_link(self, link_id):
        """Finds a link by ID."""
        for link in self.links:
            if link["id"] == link_id:
                return link
        return None

    def get_node(self, node_id):
        """Finds a node by ID."""
        for node in self.nodes:
            if node["id"] == node_id:
                return node
        return None

    def update_link_capacity(self, link_id, new_capacity_mbps):
        """Modifies link bandwidth capacity within validated boundaries."""
        link = self.get_link(link_id)
        if not link:
            return False, f"Link {link_id} not found"
        try:
            val = float(new_capacity_mbps)
            if val <= 0:
                return False, "Capacity must be greater than 0 Mbps"
            if val > 10000:
                return False, "Capacity exceeds 10 Gbps limit"
            link["capacity_mbps"] = round(val, 2)
            return True, f"Link {link_id} capacity updated to {val} Mbps"
        except (ValueError, TypeError):
            return False, "Invalid capacity format"

    def add_host(self, host_label, dept_switch_id, ip_address=None, block_id=None):
        """Adds a simulated host attached to an existing switch."""
        parent_sw = self.get_node(dept_switch_id)
        if not parent_sw:
            return False, f"Target switch {dept_switch_id} not found"

        host_id = f"H_CUSTOM_{len(self.nodes) + 1}"
        dept_name = parent_sw.get("dept", "General")
        blk_id = block_id or parent_sw.get("block_id", "BLOCK_C")

        if not ip_address:
            subnet_prefix = parent_sw.get("ip", "10.300.0.1").rsplit(".", 1)[0]
            ip_address = f"{subnet_prefix}.{100 + len(self.nodes)}"

        x_pos = parent_sw.get("x", 500)
        y_pos = 460

        new_node = {
            "id": host_id,
            "label": host_label,
            "type": "host",
            "layer": "access",
            "ip": ip_address,
            "dept": dept_name,
            "block_id": blk_id,
            "switch_id": dept_switch_id,
            "x": x_pos,
            "y": y_pos
        }

        new_link = {
            "id": f"L_CUSTOM_{host_id}",
            "name": f"{parent_sw.get('label')} ↔ {host_label}",
            "source": dept_switch_id,
            "target": host_id,
            "block_id": blk_id,
            "capacity_mbps": 100.0,
            "propagation_delay_ms": 1.0,
            "max_queue_packets": 40,
            "offered_mbps": 0.0,
            "admitted_mbps": 0.0,
            "transmitted_mbps": 0.0,
            "dropped_mbps": 0.0,
            "utilization_pct": 0.0,
            "current_queue_packets": 0,
            "queue_occupancy_pct": 0.0,
            "packet_drops": 0,
            "latency_ms": 1.0,
            "status": "normal",
            "traffic_control_active": False
        }

        self.nodes.append(new_node)
        self.links.append(new_link)
        return True, new_node

    def remove_host(self, host_id):
        """Removes a simulated host and its associated links."""
        node = self.get_node(host_id)
        if not node:
            return False, f"Host {host_id} not found"
        if node.get("type") in ("switch", "router"):
            return False, "Cannot delete infrastructure switches or routers"

        self.nodes = [n for n in self.nodes if n["id"] != host_id]
        self.links = [l for l in self.links if l["source"] != host_id and l["target"] != host_id]
        return True, f"Host {host_id} removed"
