import sys
sys.path.insert(0, '..')
sys.path.insert(0, '../processing')
import numpy as np

# Test 1: Health score computation
def test_health_score_range():
    """Health score should always be between 0 and 100."""
    from processing.health_scorer import ChargerHealthState
    state = ChargerHealthState()
    # Simulate normal telemetry
    for i in range(10):
        state.update({
            'timestamp': 1000 + i * 5,
            'temperature': 40 + np.random.normal(0, 2),
            'voltage': 400 + np.random.normal(0, 3),
            'current': 100 + np.random.normal(0, 5),
            'power_kw': 40,
            'connector_status': 'connected_charging',
            'state': 'charging',
            'error_codes': [],
        })
    result = state.compute_health_score()
    assert 0 <= result['health_score'] <= 100
    assert result['risk_level'] in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')

# Test 2: High temperature should reduce health
def test_high_temperature_penalty():
    """Rising temperature should increase penalty."""
    from processing.health_scorer import ChargerHealthState
    state = ChargerHealthState()
    # Simulate overheating
    for i in range(20):
        state.update({
            'timestamp': 1000 + i * 5,
            'temperature': 50 + i * 2,  # Rising from 50 to 88
            'voltage': 400,
            'current': 100,
            'power_kw': 40,
            'connector_status': 'connected_charging',
            'state': 'charging',
            'error_codes': ['W001_HIGH_TEMP'] if i > 10 else [],
        })
    result = state.compute_health_score()
    assert result['health_score'] < 80  # Should be degraded
    assert result['components']['temperature_penalty'] > 5

# Test 3: Normal operation should be healthy
def test_normal_operation_healthy():
    """Normal stable readings should yield high health score."""
    from processing.health_scorer import ChargerHealthState
    state = ChargerHealthState()
    for i in range(30):
        state.update({
            'timestamp': 1000 + i * 5,
            'temperature': 38 + np.random.normal(0, 0.5),
            'voltage': 400 + np.random.normal(0, 1),
            'current': 120,
            'power_kw': 48,
            'connector_status': 'connected_charging',
            'state': 'charging',
            'error_codes': [],
        })
    result = state.compute_health_score()
    assert result['health_score'] >= 80
    assert result['risk_level'] == 'LOW'

# Test 4: Voltage instability detection
def test_voltage_instability():
    """High voltage variance should trigger penalty."""
    from processing.health_scorer import ChargerHealthState
    state = ChargerHealthState()
    for i in range(20):
        state.update({
            'timestamp': 1000 + i * 5,
            'temperature': 40,
            'voltage': 400 + np.random.normal(0, 20),  # High variance
            'current': 100,
            'power_kw': 40,
            'connector_status': 'connected_charging',
            'state': 'charging',
            'error_codes': [],
        })
    result = state.compute_health_score()
    assert result['components']['voltage_penalty'] > 0

# Test 5: Charger simulator creates valid telemetry
def test_charger_simulator():
    """Charger simulator should produce valid telemetry."""
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'simulator'))
    from charger import Charger, ChargerProfile
    import time
    profile = ChargerProfile('test_50kw', 50, (380, 420), (0, 125), (35, 55), ['CCS2'], 0.02)
    charger = Charger('TEST-001', profile)
    telemetry = charger.tick(time.time())
    data = telemetry.to_dict()
    assert data['charger_id'] == 'TEST-001'
    assert 0 <= data['temperature'] <= 120
    assert data['voltage'] >= 0
    assert data['state'] in ('idle', 'charging', 'faulted', 'offline', 'degraded')
