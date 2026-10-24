import os
import sys
import urllib.request
import json
import time

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)

from backend.app import app

def test_endpoints():
    with app.test_client() as client:
        # 1. Test Dashboard
        r1 = client.get('/api/dashboard')
        assert r1.status_code == 200, f"Dashboard failed with {r1.status_code}"
        d1 = r1.get_json()
        print("[PASS] Dashboard API check passed. Active hosts:", d1.get("active_hosts_count"))

        # 2. Test Topology
        r2 = client.get('/api/topology')
        assert r2.status_code == 200, f"Topology failed with {r2.status_code}"
        d2 = r2.get_json()
        print("[PASS] Topology API check passed. Links count:", len(d2.get("links", [])))

        # 3. Test Leaky Bucket Config
        r3 = client.post('/api/control/configure', json={
            'algorithm': 'leaky_bucket',
            'config': {'capacity_mb': 20.0, 'output_rate_mbps': 40.0}
        })
        assert r3.status_code == 200, f"Leaky bucket config failed with {r3.status_code}"
        print("[PASS] Leaky Bucket activation check passed.")

        # 4. Test Token Bucket Config
        r4 = client.post('/api/control/configure', json={
            'algorithm': 'token_bucket',
            'config': {'token_rate_mbps': 50.0, 'bucket_capacity_tokens': 60.0, 'mode': 'shaping'}
        })
        assert r4.status_code == 200, f"Token bucket config failed with {r4.status_code}"
        print("[PASS] Token Bucket activation check passed.")

        # 5. Test QoS Configuration
        r5 = client.post('/api/control/qos', json={
            'mode': 'priority',
            'total_buffer_mb': 25.0,
            'link_capacity_mbps': 50.0
        })
        assert r5.status_code == 200, f"QoS config failed with {r5.status_code}"
        print("[PASS] QoS Priority activation check passed.")

        # 6. Test Experiment Runner
        r6 = client.post('/api/experiments/run', json={
            'profile': 'burst_traffic',
            'duration': 10,
            'algorithm': 'leaky_bucket',
            'random_seed': 42
        })
        assert r6.status_code == 200, f"Experiment run failed with {r6.status_code}"
        exp = r6.get_json()["experiment"]
        print("[PASS] Experiment comparison check passed. Baseline loss:", exp["baseline_results"]["packet_loss_pct"], "%")

        # 7. Test Frontend Index.html Serving
        r7 = client.get('/')
        assert r7.status_code == 200, f"Frontend index serving failed with {r7.status_code}"
        print("[PASS] Frontend SPA index.html serving check passed.")

        # 8. Test CSV Exports
        r8 = client.get('/api/export/metrics/csv')
        assert r8.status_code == 200, f"Metrics CSV export failed with {r8.status_code}"
        r9 = client.get('/api/export/events/csv')
        assert r9.status_code == 200, f"Events CSV export failed with {r9.status_code}"
        r10 = client.get('/api/export/experiment/report')
        assert r10.status_code == 200, f"HTML report export failed with {r10.status_code}"
        print("[PASS] CSV and HTML report exports check passed.")

        # 9. Test VNR Blocks Endpoint
        r11 = client.get('/api/blocks')
        assert r11.status_code == 200, f"Blocks failed with {r11.status_code}"
        d11 = r11.get_json()
        assert "BLOCK_A" in d11
        print("[PASS] VNR Blocks API check passed. Total blocks:", len(d11))

        # 10. Test Devices NAC Endpoint
        r12 = client.get('/api/devices')
        assert r12.status_code == 200, f"Devices failed with {r12.status_code}"
        d12 = r12.get_json()
        print("[PASS] NAC Devices API check passed. Total devices:", len(d12.get("devices", [])))

        # 11. Test Campus Scenarios Endpoint
        r13 = client.get('/api/scenarios')
        assert r13.status_code == 200, f"Scenarios failed with {r13.status_code}"
        d13 = r13.get_json()
        assert "tech_fest" in d13.get("scenarios", {})
        print("[PASS] Campus Scenarios API check passed. Scenarios:", list(d13.get("scenarios", {}).keys()))

    print("\nALL BACKEND & FRONTEND INTEGRATION CHECKS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    test_endpoints()
