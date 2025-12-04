# 自動バックアップ設定ガイド

VPS上で定期的にデータをバックアップするための設定手順です。
毎日深夜にデータを圧縮して保存し、古いバックアップを自動削除するように設定します。

## 1. バックアップスクリプトの準備

リポジトリに含まれている `scripts/backup.sh` を使用します。
次回のデプロイでサーバーに配置されますが、すぐに設定したい場合は手動でアップロードするか、以下の手順で作成してください。

## 2. スクリプトの権限設定 (VPS上)

VPSにSSH接続し、スクリプトに実行権限を与えます。

```bash
chmod +x /var/www/auto-audition/scripts/backup.sh
```

## 3. 定期実行 (Cron) の設定

`cron` を使って、毎日決まった時間にスクリプトを実行させます。

1.  Cronの設定ファイルを開きます。
    ```bash
    crontab -e
    ```
    ※ エディタの選択画面が出たら、`1` (nano) を選ぶのが簡単です。

2.  ファイルの末尾に以下の行を追加します。
    (例: 毎日 午前3時00分 に実行)

    ```
    0 3 * * * /var/www/auto-audition/scripts/backup.sh >> /home/ubuntu/backup.log 2>&1
    ```

3.  保存して終了します。
    *   Nanoの場合: `Ctrl+O` -> `Enter` -> `Ctrl+X`

## 4. バックアップの確認

設定した時間（または手動実行）の後、バックアップが作成されているか確認します。

```bash
# 手動テスト
/var/www/auto-audition/scripts/backup.sh

# 確認
ls -l /home/ubuntu/backups/
```

`backup_20251205_030000.tar.gz` のようなファイルができていれば成功です。
7日以上経過した古いバックアップは自動的に削除されます。

## 5. ローカルへのダウンロード (推奨)

サーバー自体が壊れた場合に備えて、たまにローカルPCにダウンロードすることをお勧めします。

```bash
# ローカルPCのターミナルで実行
scp -i /path/to/kagoya_key.pem ubuntu@<IPアドレス>:~/backups/backup_*.tar.gz ./
```
