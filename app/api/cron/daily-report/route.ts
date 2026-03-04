import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: Request) {
    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 });
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const { data: logins, error } = await supabase
            .from('login_history')
            .select('*')
            .gte('login_time', yesterday.toISOString())
            .order('login_time', { ascending: false });

        if (error) throw error;

        if (!logins || logins.length === 0) {
            return NextResponse.json({ message: 'No logins in the past 24 hours.' });
        }

        let reportText = `AlphaLens Daily Login Report (${new Date().toLocaleDateString('zh-CN')})\n\n`;
        reportText += `Total Logins (Past 24H): ${logins.length}\n`;
        reportText += `----------------------------------------\n\n`;

        logins.forEach(login => {
            const time = new Date(login.login_time).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
            const durationMins = Math.round((login.duration_seconds || 0) / 60);
            reportText += `Email: ${login.email}\n`;
            reportText += `Time: ${time}\n`;
            reportText += `IP: ${login.ip_address}\n`;
            reportText += `Location: ${login.location || 'Unknown'}\n`;
            reportText += `Duration: ${durationMins} minutes\n`;
            reportText += `\n`;
        });

        const targetEmail = 'robin.ma.1102@gmail.com';

        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;

        if (!smtpHost || !smtpUser || !smtpPass) {
            console.log("CRON Email Report (SMTP Config Missing):\n", reportText);
            return NextResponse.json({
                message: 'Report generated successfully, but SMTP variables are not configured in Vercel. Logged payload to console.',
                report: reportText
            });
        }

        let transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        await transporter.sendMail({
            from: `"AlphaLens Monitor" <${smtpUser}>`,
            to: targetEmail,
            subject: "AlphaLens Daily Login Report",
            text: reportText,
        });

        return NextResponse.json({ success: true, count: logins.length });
    } catch (error) {
        console.error('Cron Report Error:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
