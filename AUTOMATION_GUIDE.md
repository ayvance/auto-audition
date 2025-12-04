# VPS運用自動化・ベストプラクティスガイド

このドキュメントは、Next.js (Node.js) アプリケーションを VPS で運用する際に構築した「デプロイ自動化」「データ保全」「バックアップ」の仕組みをまとめたものです。
他のプロジェクトでも汎用的に利用できる構成になっています。

---

## 1. GitHub Actions による自動デプロイ

GitHub の `main` ブランチにプッシュされたら、自動的に VPS に反映させる仕組みです。

### 仕組み
1.  GitHub Actions が SSH で VPS に接続。
2.  `git fetch` & `git reset --hard` で強制的に最新コードを同期。
3.  `npm ci` & `npm run build` でビルド。
4.  `pm2 restart` でアプリを再起動。

### 必要なファイル: `.github/workflows/deploy.yml`

```yaml
name: Deploy to VPS

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        env:
          PRIVATE_KEY: ${{ secrets.VPS_SSH_KEY }}
          HOST: ${{ secrets.VPS_HOST }}
          USER: ${{ secrets.VPS_USER }} # 通常は ubuntu
        run: |
          mkdir -p ~/.ssh
          echo "$PRIVATE_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan -H $HOST >> ~/.ssh/known_hosts
          
          ssh -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa $USER@$HOST << 'EOF'
            # Gitの所有権エラー回避
            git config --global --add safe.directory /var/www/your-app-name
            
            cd /var/www/your-app-name
            
            # 強制同期 (ローカルの変更を破棄して最新にする)
            git fetch --all
            git reset --hard origin/main
            
            # ビルド & 再起動
            npm ci
            npm run build
            pm2 restart ecosystem.config.js
          EOF
```

### ポイント
*   **`git reset --hard`**: `git pull` だけだとコンフリクトで止まることがあるため、強制同期が最も安定します。
*   **`safe.directory`**: Gitのセキュリティ機能によるエラーを防ぐため必須です。

---

## 2. PM2 によるプロセス管理 (権限問題の回避)

PM2 は Node.js アプリの管理ツールですが、**実行ユーザー** に注意が必要です。

### 落とし穴
*   `sudo pm2 start ...` で起動すると、プロセスは **root** 権限になります。
*   GitHub Actions (SSH) は通常 **ubuntu** などの一般ユーザーでログインします。
*   **結果**: Actions から `pm2 restart` しようとしても、権限不足で失敗します。

### 正しい設定手順
必ず **sudoなし** で PM2 を起動・登録します。

```bash
# 1. 既存のrootプロセスがあれば殺す
sudo pm2 kill

# 2. 一般ユーザーで起動
pm2 start ecosystem.config.js
pm2 save

# 3. 自動起動設定 (表示されるコマンドを実行)
pm2 startup
# -> sudo env PATH=$PATH:/usr/bin ... というコマンドが表示されるのでコピペして実行
```

---

## 3. 本番データの保護 (Git管理外へ)

ユーザーがアップロードした画像や、本番環境で保存されたDBファイル (`data/*.json` など) が、デプロイのたびに初期化されるのを防ぎます。

### 手順
1.  **`.gitignore` に追加**:
    ```gitignore
    /data/*
    !/data/.keep
    ```
2.  **Gitのインデックスから削除**:
    ```bash
    git rm -r --cached data/
    git commit -m "Stop tracking data files"
    ```
3.  **本番サーバーでの復元**:
    この操作をプッシュすると、本番サーバーのファイルも一度消えるため、事前にバックアップを取り、デプロイ後に書き戻す作業が一度だけ必要です。

---

## 4. 定期バックアップの自動化

万が一データが消えた場合に備え、毎日自動でバックアップを取ります。

### スクリプト: `scripts/backup.sh`

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATA_DIR="/var/www/your-app-name/data"
FILENAME="backup_$(date +%Y%m%d).tar.gz"

mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/$FILENAME" -C "$(dirname "$DATA_DIR")" "$(basename "$DATA_DIR")"

# 7日以上前の古いファイルを削除
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete
```

### Cron設定 (VPS上)

`crontab -e` で設定します。

```
# 毎日 午前3時に実行
0 3 * * * /var/www/your-app-name/scripts/backup.sh >> /home/ubuntu/backup.log 2>&1
```

---

この構成により、**「コードはGitで管理し自動デプロイ」「データはサーバー上で永続化・バックアップ」** という、安全かつ効率的な運用が可能になります。
