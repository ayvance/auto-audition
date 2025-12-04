#!/bin/bash

# 設定
BACKUP_DIR="/home/ubuntu/backups"
DATA_DIR="/var/www/auto-audition/data"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="backup_${TIMESTAMP}.tar.gz"
RETENTION_DAYS=7

# バックアップディレクトリの作成
mkdir -p "$BACKUP_DIR"

# データの圧縮・バックアップ
echo "Backing up $DATA_DIR to $BACKUP_DIR/$FILENAME..."
tar -czf "$BACKUP_DIR/$FILENAME" -C "$(dirname "$DATA_DIR")" "$(basename "$DATA_DIR")"

# 結果の確認
if [ $? -eq 0 ]; then
  echo "Backup successful: $FILENAME"
else
  echo "Backup failed!"
  exit 1
fi

# 古いバックアップの削除 (7日以上前)
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Done."
