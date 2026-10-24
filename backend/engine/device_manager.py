"""
Campus Network Access Control (NAC) & Device Permission Manager
Regulates authorized college infrastructure vs unauthorized/external guest devices,
implements captive portal approval queues, and enforces bandwidth caps.
"""

from datetime import datetime
import copy

INITIAL_CAMPUS_DEVICES = [
    # Authorized College Infrastructure
    {
        "mac_address": "00:1A:2B:3C:4D:01",
        "device_name": "VNR Autonomous Exam Branch Master Server",
        "device_type": "Institutional Server",
        "owner": "Examination Branch",
        "target_block": "BLOCK_A",
        "ip_address": "10.100.1.10",
        "status": "authorized",
        "bandwidth_cap_mbps": 100.0,
        "is_college_asset": True,
        "first_seen": "2026-10-14T08:00:00",
        "notes": "Static MAC Whitelist - Exam Network"
    },
    {
        "mac_address": "00:1A:2B:3C:4D:02",
        "device_name": "VNR Central ERP / Automation Gateway",
        "device_type": "Institutional Server",
        "owner": "IT Administration",
        "target_block": "BLOCK_A",
        "ip_address": "10.100.1.20",
        "status": "authorized",
        "bandwidth_cap_mbps": 100.0,
        "is_college_asset": True,
        "first_seen": "2026-10-14T08:00:00",
        "notes": "Student Database & Attendance Portal"
    },
    {
        "mac_address": "38:F9:D3:55:12:0A",
        "device_name": "CSE AI & GPU Cluster Master Node",
        "device_type": "High-Performance Workstation",
        "owner": "CSE Dept Lab 1",
        "target_block": "BLOCK_C",
        "ip_address": "10.300.1.10",
        "status": "authorized",
        "bandwidth_cap_mbps": 100.0,
        "is_college_asset": True,
        "first_seen": "2026-10-14T08:00:00",
        "notes": "Dedicated Research Node"
    },
    {
        "mac_address": "70:85:C2:A1:04:9E",
        "device_name": "Faculty Research Laptop (Dr. Rao - ECE)",
        "device_type": "Faculty Laptop",
        "owner": "Dr. K. Rao (ECE)",
        "target_block": "BLOCK_B",
        "ip_address": "10.200.1.18",
        "status": "authorized",
        "bandwidth_cap_mbps": 50.0,
        "is_college_asset": True,
        "first_seen": "2026-10-14T09:15:00",
        "notes": "Faculty Subnet Pass"
    },
    # Guest & Unauthorized Devices Waiting for Permission
    {
        "mac_address": "DC:A6:32:7E:11:0B",
        "device_name": "External Android Device (Visitor Phone)",
        "device_type": "Guest Smartphone",
        "owner": "External Visitor",
        "target_block": "WIFI_MESH",
        "ip_address": "10.700.99.14",
        "status": "pending_approval",
        "bandwidth_cap_mbps": 10.0,
        "is_college_asset": False,
        "first_seen": "2026-10-24T09:30:00",
        "notes": "Attempting Wi-Fi Connection • Tech Fest Attendee"
    },
    {
        "mac_address": "F4:D4:88:9C:34:21",
        "device_name": "Guest MacBook Pro (Hackathon Participant)",
        "device_type": "External Laptop",
        "owner": "CBIT Hackathon Team",
        "target_block": "BLOCK_C",
        "ip_address": "10.300.99.25",
        "status": "pending_approval",
        "bandwidth_cap_mbps": 15.0,
        "is_college_asset": False,
        "first_seen": "2026-10-24T09:42:00",
        "notes": "Requesting access to C-Block Lab Wi-Fi during Convergence Fest"
    },
    {
        "mac_address": "B8:27:EB:0F:7D:66",
        "device_name": "Unknown ESP32 IoT Microcontroller",
        "device_type": "Unidentified Hardware",
        "owner": "Unknown",
        "target_block": "BLOCK_B",
        "ip_address": "10.200.99.88",
        "status": "quarantined",
        "bandwidth_cap_mbps": 0.0,
        "is_college_asset": False,
        "first_seen": "2026-10-24T10:05:00",
        "notes": "Quarantined: Unregistered MAC sending broadcast ARP sweeps"
    }
]


class DeviceManager:
    """Manages Network Access Control (NAC), guest permissions, and quarantine."""

    def __init__(self):
        self.devices = copy.deepcopy(INITIAL_CAMPUS_DEVICES)

    def list_devices(self, status=None, block=None):
        """Returns list of devices with optional filtering."""
        res = self.devices
        if status:
            res = [d for d in res if d.get("status") == status]
        if block:
            res = [d for d in res if d.get("target_block") == block]
        return res

    def get_device(self, mac_address):
        """Finds device by MAC address."""
        for d in self.devices:
            if d["mac_address"].upper() == mac_address.upper():
                return d
        return None

    def request_access(self, device_data):
        """Simulates an unauthorized or guest device requesting campus network access."""
        mac = device_data.get("mac_address", "").upper()
        if not mac:
            mac = f"GUEST:{hex(int(datetime.now().timestamp() * 1000))[-6:].upper()}"

        existing = self.get_device(mac)
        if existing:
            return False, "Device already registered or requested", existing

        new_device = {
            "mac_address": mac,
            "device_name": device_data.get("device_name", "Unidentified Guest Device"),
            "device_type": device_data.get("device_type", "Guest BYOD"),
            "owner": device_data.get("owner", "External Visitor"),
            "target_block": device_data.get("target_block", "WIFI_MESH"),
            "ip_address": device_data.get("ip_address", f"10.700.99.{len(self.devices) + 10}"),
            "status": "pending_approval",
            "bandwidth_cap_mbps": float(device_data.get("bandwidth_cap_mbps", 10.0)),
            "is_college_asset": False,
            "first_seen": datetime.now().isoformat(),
            "notes": device_data.get("notes", "New access request via Captive Portal")
        }

        self.devices.append(new_device)
        return True, "Access request submitted for admin authorization", new_device

    def authorize_device(self, mac_address, status="guest_allowed", bandwidth_cap=15.0, note=""):
        """Approves a pending device, granting it guest or authorized access with a bandwidth quota."""
        dev = self.get_device(mac_address)
        if not dev:
            return False, f"Device with MAC {mac_address} not found"

        dev["status"] = status
        dev["bandwidth_cap_mbps"] = max(1.0, float(bandwidth_cap))
        if note:
            dev["notes"] = f"{dev.get('notes', '')} | {note}"
        dev["approved_at"] = datetime.now().isoformat()
        return True, f"Device {dev['device_name']} authorized as {status} (Cap: {bandwidth_cap} Mbps)"

    def quarantine_device(self, mac_address, reason="Security policy violation"):
        """Isolates an unauthorized device or rogue endpoint."""
        dev = self.get_device(mac_address)
        if not dev:
            return False, f"Device with MAC {mac_address} not found"

        dev["status"] = "quarantined"
        dev["bandwidth_cap_mbps"] = 0.0
        dev["notes"] = f"Quarantined: {reason}"
        return True, f"Device {dev['device_name']} has been quarantined and isolated"

    def revoke_device(self, mac_address):
        """Completely disconnects and deletes device from campus authorization."""
        dev = self.get_device(mac_address)
        if not dev:
            return False, "Device not found"

        self.devices = [d for d in self.devices if d["mac_address"].upper() != mac_address.upper()]
        return True, f"Device {mac_address} removed from access tables"

    def get_counts(self):
        """Returns counts by status."""
        counts = {
            "total": len(self.devices),
            "authorized": len([d for d in self.devices if d["status"] == "authorized"]),
            "pending_approval": len([d for d in self.devices if d["status"] == "pending_approval"]),
            "guest_allowed": len([d for d in self.devices if d["status"] == "guest_allowed"]),
            "quarantined": len([d for d in self.devices if d["status"] in ("quarantined", "blocked")])
        }
        return counts
