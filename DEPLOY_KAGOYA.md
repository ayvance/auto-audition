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

1.  GitHub リポジトリの **Settings** > **Secrets and variables** > **Actions** を開きます。
2.  **New repository secret** をクリックし、以下を登録します。

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

## 5. 完了！

これで、`http://<IPアドレス>:3000` にアクセスするとアプリが表示されます。

以降は、ローカルでコードを修正して GitHub に `push` するだけで、自動的にサーバーに反映（デプロイ）されます。
