# KAGOYA CLOUD VPS デプロイ手順書

このドキュメントでは、作成したアプリケーションを **KAGOYA CLOUD VPS** にデプロイ（公開）する手順を説明します。

## 1. KAGOYA CLOUD VPS の契約・サーバー作成

1.  KAGOYA CLOUD VPS の管理画面にログインします。
2.  **「インスタンス作成」** をクリックします。
3.  以下の設定でサーバーを作成します：
    *   **パッケージ**: `Ubuntu 22.04 LTS` (または 20.04) ※推奨
    *   **スペック**: `1GB` プラン (日額20円〜)
    *   **ログイン用認証キー**: `キーペアを作成` を選び、ダウンロードした `.pem` ファイルを大切に保管してください（例: `kagoya_key.pem`）。
4.  作成が完了すると、**IPアドレス**（例: `123.45.67.89`）が表示されます。これをメモしてください。

## 2. GitHub リポジトリの準備

1.  GitHub に新しいリポジトリを作成します（Private推奨）。
2.  現在のコードをプッシュします。
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin <あなたのリポジトリURL>
    git push -u origin main
    ```

## 3. GitHub Secrets の設定

GitHub Actions が VPS にアクセスできるように、鍵情報を登録します。
**重要**: この設定は、コード（ファイル）に書くのではなく、**GitHubのウェブサイト上で行います**。

1.  ブラウザで GitHub のリポジトリページを開きます。
2.  上部タブの **Settings** をクリックします。
3.  左サイドバーの **Secrets and variables** をクリックし、**Actions** を選択します。
4.  **New repository secret** (緑色のボタン) をクリックし、以下の4つを順番に登録します。

| Name | Value (入力する値) |
| :--- | :--- |
| `VPS_HOST` | KAGOYAで発行された **IPアドレス** (例: `123.45.67.89`) |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | ダウンロードした `.pem` ファイルの中身を**すべて**コピーして貼り付け |
| `VPS_PORT` | `22` |

## 4. サーバーの初期設定 (初回のみ)

自分のPCのターミナルから、VPSに接続して初期設定スクリプトを実行します。

1.  **SSH接続**:
    ```bash
    # キーファイルの権限を変更 (必須)
    chmod 600 /path/to/kagoya_key.pem

    # 接続
    ssh -i /path/to/kagoya_key.pem root@<IPアドレス>
    ```

2.  **セットアップ実行**:
    サーバーにログインできたら、以下のコマンドを1行ずつ実行してください。

    ```bash
    # リポジトリのクローン (最初は手動で行います)
    mkdir -p /var/www
    cd /var/www
    git clone <あなたのリポジトリURL> auto-audition
    
    # セットアップスクリプトの実行
    cd auto-audition
    chmod +x scripts/setup-vps.sh
    ./scripts/setup-vps.sh
    ```

    ※ `git clone` 時に GitHub のユーザー名とパスワード(Token)を聞かれる場合があります。

3.  **アプリ起動**:
    ```bash
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    ```

## 6. データの移行 (初回のみ)

ローカルにある設定データ（質問、規約、ロゴなど）をVPSにコピーします。
**注意**: これを行わないと、VPS上では初期状態（データなし）で始まります。

ローカルPCのターミナルで以下を実行してください：

```bash
# dataフォルダの中身をVPSにアップロード
scp -i /path/to/kagoya_key.pem -r data/* root@<IPアドレス>:/var/www/auto-audition/data/

# public/uploadsフォルダ（もしあれば）もアップロード
scp -i /path/to/kagoya_key.pem -r public/uploads/* root@<IPアドレス>:/var/www/auto-audition/public/uploads/
```

## 8. ドメイン設定 (ConoHa WING)

ConoHa WING で管理しているドメインのサブドメイン（例: `interview.example.com`）を、このVPSに向けます。

1.  **ConoHa コントロールパネル** にログインします。
2.  左メニューの **「DNS」** をクリックします。
3.  設定したいドメインをクリックします。
4.  **「DNSレコード設定」** の鉛筆アイコン（編集）をクリックし、`+` ボタンで以下を追加します：

| 項目 | 設定値 | 説明 |
| :--- | :--- | :--- |
| **タイプ** | `A` | (通常) |
| **名称** | `interview` | サブドメイン名 (例: interview.example.com なら `interview`) |
| **TTL** | `3600` | (デフォルトのままでOK) |
| **値** | `<VPSのIPアドレス>` | 手順1で確認したIP (例: `123.45.67.89`) |

5.  **「保存」** をクリックします。
    *   ※ 反映されるまで数分〜1時間程度かかる場合があります。

## 9. HTTPS化 (Let's Encrypt 自動設定)

**重要**: ブラウザのセキュリティ制限により、**HTTPS（鍵マーク）でないとカメラやマイクが動きません**。
ここでは **Caddy** という最新のWebサーバーを使います。Caddyは **Let's Encrypt のSSL証明書を全自動で取得・更新** してくれるため、面倒なコマンド操作は一切不要です。

1.  VPSにSSH接続します。
2.  以下のコマンドを実行して Caddy をインストール・設定します：

    ```bash
    # Caddyのインストール
    sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt update
    sudo apt install caddy

    # Caddyの設定 (永続化設定)
    # インストール直後からCaddyはバックグラウンドで動いているため、設定ファイルを直接編集します。
    ```

    1.  `Caddyfile` を編集します:
        ```bash
        sudo nano /etc/caddy/Caddyfile
        ```
    2.  中身を**すべて消して**、以下のように書き換えて保存します (`Ctrl+O` -> `Enter` -> `Ctrl+X`):
        ```
        your-domain.com {
            reverse_proxy :3000
        }
        ```
        ※ `your-domain.com` は自分のドメイン（例: `audition.virtuacross.com`）に書き換えてください。
        ※ ドメインの末尾に `.com.com` のように重複がないか注意してください。

    3.  Caddyを再起動して設定を反映します:
    3.  Caddyを再起動します:
        ```bash
        sudo systemctl restart caddy
        ```

3.  これで `https://your-domain.com` にアクセスできるようになります。
    *   **証明書の更新も自動**で行われるため、期限切れの心配はありません。

## 10. セキュリティ設定 (推奨)

ファイアウォール (UFW) を有効にして、必要なポート以外を閉じます。

```bash
# SSH, HTTP, HTTPS を許可
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443

# ファイアウォール有効化
sudo ufw enable
# (確認で y を入力)
```

## 11. 完了！

これで、`https://<あなたのドメイン>` で安全にアプリが利用できます。

**運用上の注意:**
*   **バックアップ**: `data` フォルダには重要なデータ（応募情報など）が含まれます。定期的にローカルにコピーするなどしてバックアップを取ることを強く推奨します。

## 12. 運用・保守マニュアル

長く安定して運用するために、以下の点を定期的にチェックしてください。

### 1. ディスク容量の監視 (重要)
動画ファイルは容量を圧迫しやすいため、定期的に空き容量を確認してください。

```bash
# ディスク使用量を確認
df -h
```
*   `Use%` が 90% を超えたら危険信号です。不要な動画を削除するか、プランのアップグレードを検討してください。

### 2. アプリケーションの更新手順
機能追加やバグ修正を行ったら、以下の手順で本番環境に反映します。

1.  ローカルでコードを修正し、GitHubにプッシュ。
2.  VPSで以下のコマンドを実行（またはGitHub Actionsが自動実行）：
    ```bash
    cd /var/www/auto-audition
    git pull origin main
    npm ci
    npm run build
    pm2 restart ecosystem.config.js
    ```

### 3. ログの確認
エラーが発生した場合などは、ログを確認します。

```bash
# リアルタイムログ表示
pm2 logs

# 過去のログファイル場所
# /root/.pm2/logs/
```

### 4. データのバックアップ (手動)
万が一に備え、定期的にデータを自分のPCにダウンロードしておきましょう。

```bash
# ローカルPCのターミナルで実行
# (今日の日付のフォルダを作ってバックアップする例)
mkdir -p backup_$(date +%Y%m%d)
scp -i /path/to/kagoya_key.pem -r root@<IPアドレス>:/var/www/auto-audition/data backup_$(date +%Y%m%d)/
```

## 13. トラブルシューティング

### GitHub Actions で "ssh.ParsePrivateKey: asn1: structure error" が出る場合
これは **SSH鍵のコピー＆ペーストミス** が原因です。

**解決策:**
1.  `.pem` ファイルをテキストエディタ（メモ帳など）で開きます。
2.  `-----BEGIN RSA PRIVATE KEY-----` から `-----END RSA PRIVATE KEY-----` までを**完全に**コピーしてください。
3.  GitHub Secrets の `VPS_SSH_KEY` を編集し、一度すべて削除してから貼り付け直します。
    *   **注意**: 最後の行の後に余分な改行が入っていないか確認してください。
