"""One-shot training entrypoint for the weekly SVR+GA model.

Usage:
  ./bin/python train_weekly.py

This is intended to be run by a scheduler (cron/systemd/Docker) at ~02:00.
"""

from ml.weekly_svr_ga import train_weekly_pipeline


if __name__ == "__main__":
    meta = train_weekly_pipeline(verbose=True)
    print("\n[train_weekly] Done")
    print(meta)
