import { NextResponse } from 'next/server';
import { getSubmissions, saveSubmission } from '@/lib/storage';

export async function GET() {
    const submissions = await getSubmissions();
    return NextResponse.json(submissions);
}

export async function POST(request) {
    try {
        const body = await request.json();
        // body should contain: candidateInfo, answers
        // Map candidateInfo to candidateName for backward compatibility if needed, or just store as is.
        // We'll store candidateInfo. The storage helper might expect candidateName for listing?
        // Let's check storage.js... actually storage.js just pushes the object.
        // But we should ensure candidateName exists for the list view if we want to keep it simple,
        // or update the list view to look at candidateInfo.
        // For robustness, let's extract a display name from candidateInfo (first field or 'name' field).

        let candidateName = "Unknown";
        if (body.candidateInfo) {
            // Try to find a field with 'name' in id, or just take the first value
            const info = body.candidateInfo;
            const nameKey = Object.keys(info).find(k => k.toLowerCase().includes('name')) || Object.keys(info)[0];
            if (nameKey) candidateName = info[nameKey];
        } else if (body.candidateName) {
            candidateName = body.candidateName;
        }

        const submissionData = {
            ...body,
            candidateName, // explicit field for easier listing
        };

        const newSubmission = await saveSubmission(submissionData);

        // Send Notification if Webhook URL is set
        try {
            const { getTerms } = await import('@/lib/storage');
            const terms = await getTerms();
            if (terms.webhookUrl) {
                const message = {
                    text: `🎉 **新しい応募がありました！**\n\n**候補者名**: ${candidateName}\n**ID**: ${newSubmission.id}\n\n<${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/submissions/${newSubmission.id}|詳細を確認する>`,
                    // Slack specific blocks for better formatting (optional but nice)
                    blocks: [
                        {
                            type: "section",
                            text: {
                                type: "mrkdwn",
                                text: `🎉 *新しい応募がありました！*`
                            }
                        },
                        {
                            type: "section",
                            fields: [
                                {
                                    type: "mrkdwn",
                                    text: `*候補者名:*\n${candidateName}`
                                },
                                {
                                    type: "mrkdwn",
                                    text: `*ID:*\n${newSubmission.id}`
                                }
                            ]
                        },
                        {
                            type: "actions",
                            elements: [
                                {
                                    type: "button",
                                    text: {
                                        type: "plain_text",
                                        text: "詳細を確認する"
                                    },
                                    url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/submissions/${newSubmission.id}`,
                                    style: "primary"
                                }
                            ]
                        }
                    ]
                };

                // Discord compatibility (Discord webhooks accept 'content' instead of 'text' for simple messages, but 'text' works for Slack)
                // For universal compatibility, we can send a simple JSON payload.
                // However, Slack blocks structure is specific.
                // Let's try a simple payload first that works for both or detect.
                // Actually, for Discord, adding '/slack' to the end of the webhook URL makes it compatible with Slack payloads!
                // But we can't assume the user knows that.
                // Let's send a generic payload if it looks like Discord, or just standard JSON.
                
                let payload = message;
                if (terms.webhookUrl.includes("discord.com")) {
                     payload = {
                        content: `🎉 **新しい応募がありました！**\n\n**候補者名**: ${candidateName}\n**ID**: ${newSubmission.id}\n\n${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/submissions/${newSubmission.id}`
                     };
                }

                await fetch(terms.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
        } catch (notifyError) {
            console.error("Notification failed:", notifyError);
            // Don't fail the submission just because notification failed
        }

        return NextResponse.json({ success: true, submission: newSubmission });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
    }
}
