import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from util.watchlist import WatchlistManager
from pathlib import Path

def test_watchlist_manager():
    # Setup test environment
    test_path = Path("./test_watchlist.json")
    if test_path.exists():
        test_path.unlink()
    
    print("Initializing WatchlistManager with test file...")
    manager = WatchlistManager(filepath=test_path)
    
    # Test 1: Empty init
    initial = manager.get_all()
    print(f"Initial list: {initial}")
    assert len(initial) == 0, "Initial list should be empty"

    # Test 2: Add
    print("Adding SPY...")
    success, msg = manager.add("SPY")
    assert success, f"Add failed: {msg}"
    assert len(manager.get_all()) == 1
    assert manager.get_all()[0]['symbol'] == "SPY"
    print("SPY added successfully.")

    # Test 3: Add duplicate
    print("Adding SPY again...")
    success, msg = manager.add("spy") # Test case insensitivity normalization
    assert not success, "Duplicate add should fail"
    print(f"Duplicate check passed: {msg}")

    # Test 4: Add another
    print("Adding QQQ...")
    manager.add("QQQ")
    assert len(manager.get_all()) == 2
    print("QQQ added.")

    # Test 5: Remove
    print("Removing SPY...")
    success, msg = manager.remove("SPY")
    assert success, f"Remove failed: {msg}"
    current = manager.get_all()
    assert len(current) == 1
    assert current[0]['symbol'] == "QQQ"
    print("SPY removed successfully.")

    # Test 6: Remove non-existent
    print("Removing AAPL (not in list)...")
    success, msg = manager.remove("AAPL")
    assert not success, "Remove non-existent should fail"
    print(f"Non-existent remove check passed: {msg}")

    # Cleanup
    if test_path.exists():
        test_path.unlink()
    print("\nALL TESTS PASSED!")

if __name__ == "__main__":
    # Add src to path so imports work
    import sys
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))
    test_watchlist_manager()
