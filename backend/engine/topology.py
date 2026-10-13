"""
Campus Network Topology Model
Represents the hierarchical campus network: Core Router, Core Switch,
Department Switches (CSE, ECE, Administration, Library), Student Wi-Fi, and simulated hosts.
"""

import copy

DEFAULT_TOPOLOGY = {
    "nodes": [
        # Core Layer
        {"id": "R_CORE", "label": "Campus Core Router", "type": "router", "layer": "core", "ip": "10.0.0.1", "subnet": "10.0.0.0/16", "x": 500, "y": 60},
        {"id": "SW_CORE", "label": "Campus Core Switch (Trunk)", "type": "switch", "layer": "core", "ip": "10.0.0.2", "vlan": "All (802.1Q)", "x": 500, "y": 170},

        # Distribution / Department Layer
        {"id": "SW_CSE", "label": "CSE Dept Switch", "type": "switch", "layer": "distribution", "ip": "10.10.0.1", "vlan": "VLAN 10", "dept": "CSE", "x": 140, "y": 290},
        {"id": "SW_ECE", "label": "ECE Dept Switch", "type": "switch", "layer": "distribution", "ip": "10.20.0.1", "vlan": "VLAN 20", "dept": "ECE", "x": 320, "y": 290},
        {"id": "SW_ADMIN", "label": "Admin Dept Switch", "type": "switch", "layer": "distribution", "ip": "10.30.0.1", "vlan": "VLAN 30", "dept": "Administration", "x": 500, "y": 290},
        {"id": "SW_LIB", "label": "Library Switch", "type": "switch", "layer": "distribution", "ip": "10.40.0.1", "vlan": "VLAN 40", "dept": "Library", "x": 680, "y": 290},
        {"id": "AP_WIFI", "label": "Student Wi-Fi Gateway", "type": "access_point", "layer": "distribution", "ip": "10.50.0.1", "vlan": "VLAN 50", "dept": "Student Wi-Fi", "x": 860, "y": 290},

        # Access / Host Layer
        {"id": "H_CSE_1", "label": "CSE Coding Lab-1", "type": "host", "layer": "access", "ip": "10.10.0.11", "dept": "CSE", "switch_id": "SW_CSE", "x": 80, "y": 420},
        {"id": "H_CSE_2", "label": "CSE AI/Cloud Server", "type": "host", "layer": "access", "ip": "10.10.0.12", "dept": "CSE", "switch_id": "SW_CSE", "x": 190, "y": 420},

        {"id": "H_ECE_1", "label": "ECE IoT & Embedded Lab", "type": "host", "layer": "access", "ip": "10.20.0.11", "dept": "ECE", "switch_id": "SW_ECE", "x": 280, "y": 420},
        {"id": "H_ECE_2", "label": "ECE DSP Workstation", "type": "host", "layer": "access", "ip": "10.20.0.12", "dept": "ECE", "switch_id": "SW_ECE", "x": 370, "y": 420},

        {"id": "H_ADM_1", "label": "Admin ERP / Exam Portal", "type": "host", "layer": "access", "ip": "10.30.0.11", "dept": "Administration", "switch_id": "SW_ADMIN", "x": 460, "y": 420},
        {"id": "H_ADM_2", "label": "Accounts & Finance Node", "type": "host", "layer": "access", "ip": "10.30.0.12", "dept": "Administration", "switch_id": "SW_ADMIN", "x": 550, "y": 420},

        {"id": "H_LIB_1", "label": "Library OPAC Terminal", "type": "host", "layer": "access", "ip": "10.40.0.11", "dept": "Library", "switch_id": "SW_LIB", "x": 640, "y": 420},
        {"id": "H_LIB_2", "label": "Digital Repository Server", "type": "host", "layer": "access", "ip": "10.40.0.12", "dept": "Library", "switch_id": "SW_LIB", "x": 730, "y": 420},

        {"id": "H_WIFI_1", "label": "Hostel Laptops Cluster", "type": "host", "layer": "access", "ip": "10.50.0.15", "dept": "Student Wi-Fi", "switch_id": "AP_WIFI", "x": 820, "y": 420},
        {"id": "H_WIFI_2", "label": "Campus BYOD Smartphones", "type": "host", "layer": "access", "ip": "10.50.0.25", "dept": "Student Wi-Fi", "switch_id": "AP_WIFI", "x": 920, "y": 420},
    ],
    "links": [
        # Core Backbone Link
        {
            "id": "L_CORE_BB",
            "name": "Core Router ↔ Core Switch Trunk",
            "source": "R_CORE",
            "target": "SW_CORE",
            "capacity_mbps": 1000.0,
            "propagation_delay_ms": 1.0,
            "max_queue_packets": 200,
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
        # Department Distribution Links
        {
            "id": "L_CORE_CSE",
            "name": "Core Switch ↔ CSE Dept Switch",
            "source": "SW_CORE",
            "target": "SW_CSE",
            "capacity_mbps": 100.0,
            "propagation_delay_ms": 3.0,
            "max_queue_packets": 80,
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
            "id": "L_CORE_ECE",
            "name": "Core Switch ↔ ECE Dept Switch",
            "source": "SW_CORE",
            "target": "SW_ECE",
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
            "id": "L_CORE_ADM",
            "name": "Core Switch ↔ Admin Dept Switch",
            "source": "SW_CORE",
            "target": "SW_ADMIN",
            "capacity_mbps": 50.0,
            "propagation_delay_ms": 4.0,
            "max_queue_packets": 60,
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
            "id": "L_CORE_LIB",
            "name": "Core Switch ↔ Library Switch",
            "source": "SW_CORE",
            "target": "SW_LIB",
            "capacity_mbps": 50.0,
            "propagation_delay_ms": 4.5,
            "max_queue_packets": 60,
            "offered_mbps": 0.0,
            "admitted_mbps": 0.0,
            "transmitted_mbps": 0.0,
            "dropped_mbps": 0.0,
            "utilization_pct": 0.0,
            "current_queue_packets": 0,
            "queue_occupancy_pct": 0.0,
            "packet_drops": 0,
            "latency_ms": 4.5,
            "status": "normal",
            "traffic_control_active": False
        },
        {
            "id": "L_CORE_WIFI",
            "name": "Core Switch ↔ Student Wi-Fi AP",
            "source": "SW_CORE",
            "target": "AP_WIFI",
            "capacity_mbps": 40.0,
            "propagation_delay_ms": 8.0,
            "max_queue_packets": 50,
            "offered_mbps": 0.0,
            "admitted_mbps": 0.0,
            "transmitted_mbps": 0.0,
            "dropped_mbps": 0.0,
            "utilization_pct": 0.0,
            "current_queue_packets": 0,
            "queue_occupancy_pct": 0.0,
            "packet_drops": 0,
            "latency_ms": 8.0,
            "status": "normal",
            "traffic_control_active": False
        },
        # Access Links to Hosts
        {"id": "L_CSE_H1", "name": "CSE Switch ↔ Coding Lab 1", "source": "SW_CSE", "target": "H_CSE_1", "capacity_mbps": 100.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_CSE_H2", "name": "CSE Switch ↔ AI Server", "source": "SW_CSE", "target": "H_CSE_2", "capacity_mbps": 100.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_ECE_H1", "name": "ECE Switch ↔ IoT Lab", "source": "SW_ECE", "target": "H_ECE_1", "capacity_mbps": 100.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_ECE_H2", "name": "ECE Switch ↔ DSP Workstation", "source": "SW_ECE", "target": "H_ECE_2", "capacity_mbps": 100.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_ADM_H1", "name": "Admin Switch ↔ ERP Portal", "source": "SW_ADMIN", "target": "H_ADM_1", "capacity_mbps": 50.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_ADM_H2", "name": "Admin Switch ↔ Accounts Node", "source": "SW_ADMIN", "target": "H_ADM_2", "capacity_mbps": 50.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_LIB_H1", "name": "Library Switch ↔ OPAC Node", "source": "SW_LIB", "target": "H_LIB_1", "capacity_mbps": 50.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_LIB_H2", "name": "Library Switch ↔ Digital Repo", "source": "SW_LIB", "target": "H_LIB_2", "capacity_mbps": 50.0, "propagation_delay_ms": 1.0, "max_queue_packets": 40, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 1.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_WIFI_H1", "name": "Wi-Fi AP ↔ Hostel Laptops", "source": "AP_WIFI", "target": "H_WIFI_1", "capacity_mbps": 30.0, "propagation_delay_ms": 5.0, "max_queue_packets": 30, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 5.0, "status": "normal", "traffic_control_active": False},
        {"id": "L_WIFI_H2", "name": "Wi-Fi AP ↔ Mobile BYOD", "source": "AP_WIFI", "target": "H_WIFI_2", "capacity_mbps": 20.0, "propagation_delay_ms": 6.0, "max_queue_packets": 30, "offered_mbps": 0.0, "admitted_mbps": 0.0, "transmitted_mbps": 0.0, "dropped_mbps": 0.0, "utilization_pct": 0.0, "current_queue_packets": 0, "queue_occupancy_pct": 0.0, "packet_drops": 0, "latency_ms": 6.0, "status": "normal", "traffic_control_active": False},
    ]
}


class CampusTopology:
    """Manages mutable campus topology state and host/link operations."""

    def __init__(self):
        self.reset_to_defaults()

    def reset_to_defaults(self):
        """Resets topology to baseline default campus network."""
        self.nodes = copy.deepcopy(DEFAULT_TOPOLOGY["nodes"])
        self.links = copy.deepcopy(DEFAULT_TOPOLOGY["links"])

    def get_topology(self):
        """Returns nodes and links representation."""
        return {
            "nodes": self.nodes,
            "links": self.links
        }

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

    def add_host(self, host_label, dept_switch_id, ip_address=None):
        """Adds a simulated host attached to an existing switch."""
        parent_sw = self.get_node(dept_switch_id)
        if not parent_sw:
            return False, f"Target switch {dept_switch_id} not found"

        host_id = f"H_CUSTOM_{len(self.nodes) + 1}"
        dept_name = parent_sw.get("dept", "General")

        if not ip_address:
            # Allocate IP in switch subnet
            subnet_prefix = parent_sw.get("ip", "10.99.0.1").rsplit(".", 1)[0]
            ip_address = f"{subnet_prefix}.{100 + len(self.nodes)}"

        # Determine visual coordinates based on switch position
        x_pos = parent_sw.get("x", 500)
        y_pos = 460

        new_node = {
            "id": host_id,
            "label": host_label,
            "type": "host",
            "layer": "access",
            "ip": ip_address,
            "dept": dept_name,
            "switch_id": dept_switch_id,
            "x": x_pos,
            "y": y_pos
        }

        new_link = {
            "id": f"L_CUSTOM_{host_id}",
            "name": f"{parent_sw.get('label')} ↔ {host_label}",
            "source": dept_switch_id,
            "target": host_id,
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
        if node.get("type") != "host":
            return False, "Cannot delete infrastructure switches or routers"

        self.nodes = [n for n in self.nodes if n["id"] != host_id]
        self.links = [l for l in self.links if l["source"] != host_id and l["target"] != host_id]
        return True, f"Host {host_id} removed"
