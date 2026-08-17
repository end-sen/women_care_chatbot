import os
import json
from typing import List, Dict, Any, Optional

FACILITIES_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "mock_facilities.json"))

def get_mock_facilities(facility_type: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve fictional facility list filtered by type or search term."""
    if not os.path.exists(FACILITIES_FILE):
        return []

    with open(FACILITIES_FILE, "r", encoding="utf-8") as f:
        facilities = json.load(f)

    if facility_type and facility_type != "all":
        facilities = [f for f in facilities if f.get("type") == facility_type]

    if search:
        search_lower = search.lower()
        facilities = [
            f for f in facilities
            if search_lower in f.get("name", "").lower()
            or search_lower in f.get("description", "").lower()
            or search_lower in f.get("address", "").lower()
        ]

    return facilities
