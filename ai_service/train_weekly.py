from ml.weekly_svr_ga import train_weekly_pipeline


if __name__ == "__main__":
    meta = train_weekly_pipeline(verbose=True)
    print("\n[train_weekly] Done")
    print(meta)
