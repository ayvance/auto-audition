# 通知設定ガイド (Webhook URLの発行方法)

Auto Audition システムは、新しい応募があった際に Slack または Discord に通知を送ることができます。
それぞれのサービスで **Webhook URL** を発行し、管理画面に入力してください。

---

## 1. Slack の場合 (推奨)

Slackの「Incoming Webhooks」機能を使います。

1.  通知を送りたい Slack チャンネルを決めます（例: `#interview-notifications`）。
2.  [Slack Apps](https://api.slack.com/apps) にアクセスし、**「Create New App」** をクリックします。
3.  **From scratch** を選択します。
4.  **App Name** に「Auto Audition」などと入力し、ワークスペースを選択して **Create App** をクリックします。
5.  左メニューの **Incoming Webhooks** をクリックし、スイッチを **On** に切り替えます。
6.  画面下の **Add New Webhook to Workspace** をクリックします。
7.  通知先のチャンネルを選択して **Allow** をクリックします。
8.  発行された **Webhook URL** (`https://hooks.slack.com/services/...`) をコピーします。

---

## 2. Discord の場合

Discordの標準機能である「ウェブフック」を使います。

1.  通知を送りたい Discord のテキストチャンネルの横にある **歯車アイコン (チャンネルの編集)** をクリックします。
2.  左メニューの **連携サービス (Integrations)** をクリックします。
3.  **ウェブフック (Webhooks)** を選択し、**新しいウェブフック (New Webhook)** をクリックします。
4.  名前（例: Auto Audition）やアイコンを適宜変更します。
5.  **ウェブフックURLをコピー (Copy Webhook URL)** をクリックします。
    *   URLは `https://discord.com/api/webhooks/...` のようになります。

---

## 3. 設定方法

1.  Auto Audition の管理画面 (`/admin`) にログインします。
2.  ページ下部の **「面接設定」** エリアまでスクロールします。
3.  **「通知設定」** セクションにある **Webhook URL** 欄に、コピーしたURLを貼り付けます。
4.  **「変更を保存」** ボタンをクリックします。

これで設定完了です。次回から応募があるたびに通知が届きます。
