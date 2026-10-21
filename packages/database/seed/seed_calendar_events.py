# packages/database/seed/seed_calendar_events.py
"""
Egyptian calendar events used by Retaj's forecasting feature pipeline.

Provides deterministic holiday/season windows that become the `is_holiday`,
`holiday_weight` and `holiday_name` features in `v_daily_product_timeseries`.

Usage:
    python -m packages.database.seed.seed_calendar_events
"""
import os
import sys
from datetime import date

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

# (event_name, event_type, starts_on, ends_on, weight)
CALENDAR_EVENTS = {
    2026: [
        ("coptic_christmas", "national_holiday", date(2026, 1, 7), date(2026, 1, 7), 0.60),
        ("ramadan_season", "religious_season", date(2026, 2, 18), date(2026, 3, 19), 1.00),
        ("eid_al_fitr", "religious_season", date(2026, 3, 20), date(2026, 3, 22), 1.00),
        ("sham_el_nessim", "national_holiday", date(2026, 4, 6), date(2026, 4, 6), 0.50),
        ("eid_al_adha", "religious_season", date(2026, 5, 27), date(2026, 5, 29), 0.90),
        ("islamic_new_year", "national_holiday", date(2026, 6, 17), date(2026, 6, 17), 0.40),
        ("back_to_school", "back_to_school", date(2026, 9, 15), date(2026, 10, 10), 1.00),
        ("prophet_birthday", "religious_season", date(2026, 8, 26), date(2026, 8, 26), 0.50),
        ("white_friday", "shopping_season", date(2026, 11, 20), date(2026, 11, 30), 1.00),
        ("new_year", "national_holiday", date(2027, 1, 1), date(2027, 1, 1), 0.40),
    ],
    2027: [
        ("coptic_christmas", "national_holiday", date(2027, 1, 7), date(2027, 1, 7), 0.60),
        ("ramadan_season", "religious_season", date(2027, 2, 7), date(2027, 3, 8), 1.00),
        ("eid_al_fitr", "religious_season", date(2027, 3, 9), date(2027, 3, 11), 1.00),
        ("back_to_school", "back_to_school", date(2027, 9, 15), date(2027, 10, 10), 1.00),
        ("white_friday", "shopping_season", date(2027, 11, 19), date(2027, 11, 29), 1.00),
    ],
}


def get_calendar_events(year: int = 2026, country: str = "EG"):
    """Return normalized event rows for a given year."""
    rows = []
    for event_name, event_type, starts_on, ends_on, weight in CALENDAR_EVENTS.get(year, []):
        rows.append(
            {
                "event_name": event_name,
                "event_type": event_type,
                "country": country,
                "starts_on": starts_on,
                "ends_on": ends_on,
                "weight": weight,
            }
        )
    return rows


def get_holiday_for(day: date, country: str = "EG"):
    """
    Return the matching holiday event for a calendar day (or None).

    Used by the offline/mock feature store so training and serving agree with
    the SQL calendar_events table.
    """
    for year in CALENDAR_EVENTS:
        for event_name, event_type, starts_on, ends_on, weight in CALENDAR_EVENTS[year]:
            if starts_on <= day <= ends_on:
                return {
                    "event_name": event_name,
                    "event_type": event_type,
                    "weight": weight,
                    "country": country,
                }
    return None


def seed_calendar_events(connection=None):
    """
    Upsert all calendar events into PostgreSQL.

    If `connection` is None, a psycopg2 connection is created from DATABASE_URL.
    Returns the number of rows written.
    """
    events = []
    for year in CALENDAR_EVENTS:
        events.extend(get_calendar_events(year))

    if connection is None:
        import psycopg2

        database_url = os.getenv(
            "DATABASE_URL",
            "postgresql://techzone:techzone_secret@localhost:5432/techzone_db",
        )
        connection = psycopg2.connect(database_url)

    written = 0
    with connection.cursor() as cursor:
        cursor.execute(
            """
            DELETE FROM calendar_events WHERE country = 'EG'
            """
        )
        for event in events:
            cursor.execute(
                """
                INSERT INTO calendar_events
                    (event_name, event_type, country, starts_on, ends_on, weight)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    event["event_name"],
                    event["event_type"],
                    event["country"],
                    event["starts_on"],
                    event["ends_on"],
                    event["weight"],
                ),
            )
            written += 1
    connection.commit()
    return written


if __name__ == "__main__":
    try:
        count = seed_calendar_events()
        print(f"Seeded {count} Egyptian calendar events.")
    except Exception as exc:
        rows = get_calendar_events(2026)
        print(f"Database not reachable ({exc}).")
        print(f"Prepared {len(rows)} Egyptian calendar events for 2026:")
        for row in rows:
            print(f"  - {row['event_name']}: {row['starts_on']} -> {row['ends_on']} (weight {row['weight']})")
