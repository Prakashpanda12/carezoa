"""Maps adapter: distance now, geocoding provider address coordinates later."""

from __future__ import annotations

import math
from typing import Protocol


class MapsAdapter(Protocol):
    def distance_km(self, a: tuple[float, float], b: tuple[float, float]) -> float: ...


class HaversineAdapter:
    def distance_km(self, a: tuple[float, float], b: tuple[float, float]) -> float:
        r = 6371.0
        lat1, lng1 = a
        lat2, lng2 = b
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        h = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
        )
        return r * 2 * math.atan2(math.sqrt(h), math.sqrt(1 - h))
