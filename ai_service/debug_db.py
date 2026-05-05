"""Script debug: kiểm tra collections và data trong MongoDB."""
from db.mongo_client import get_db

db = get_db()

# 1. Liệt kê tất cả collections
print("=== Collections trong DB ===")
for name in sorted(db.list_collection_names()):
    count = db[name].count_documents({})
    print(f"  {name}: {count} documents")

# 2. Kiểm tra PhieuThuePhong
print("\n=== Mẫu PhieuThuePhong (5 docs đầu) ===")
for col_name in db.list_collection_names():
    if "phieu" in col_name.lower() and "thue" in col_name.lower():
        print(f"Collection: {col_name}")
        for doc in db[col_name].find().limit(3):
            print(" ", {k: v for k, v in doc.items() if k != "_id"})
        break

# 3. Kiểm tra trạng thái
print("\n=== TrangThai của PhieuThuePhong ===")
for col_name in db.list_collection_names():
    if "phieu" in col_name.lower() and "thue" in col_name.lower():
        pipeline = [{"$group": {"_id": "$TrangThai", "count": {"$sum": 1}}}]
        for r in db[col_name].aggregate(pipeline):
            print(f"  {r['_id']}: {r['count']}")
        break
