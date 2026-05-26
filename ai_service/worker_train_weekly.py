"""Simple long-running worker that trains the weekly SVR+GA model at ~02:00 daily.

Run this as a separate process (recommended via systemd/Docker).

Environment:
- TZ: optional timezone (default system)

Usage:
  ./bin/python worker_train_weekly.py
"""

from __future__ import annotations

import os
import time
from datetime import datetime, timedelta

from ml.weekly_svr_ga import train_weekly_pipeline


def _seconds_until_next_run(hour: int = 2, minute: int = 0) -> int:
    now = datetime.now()
    target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if target <= now:
        target = target + timedelta(days=1)
    return int((target - now).total_seconds())


def main() -> None:
    print("[worker_train_weekly] Starting worker. Will train daily at 02:00.")
    print(f"[worker_train_weekly] TZ={os.getenv('TZ', '(system default)')}")

    while True:
        wait_s = _seconds_until_next_run(2, 0)
        next_time = datetime.now() + timedelta(seconds=wait_s)
        print(f"[worker_train_weekly] Next run at: {next_time.strftime('%Y-%m-%d %H:%M:%S')}")
        time.sleep(wait_s)

        print("[worker_train_weekly] Training...")
        try:
            meta = train_weekly_pipeline(verbose=True)
            print("[worker_train_weekly] ✅ Train done")
            print(meta)
        except Exception as exc:
            print(f"[worker_train_weekly] ❌ Train failed: {exc}")

        # avoid tight loop in case clock changes
        time.sleep(5)


if __name__ == "__main__":
    main()
