import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendMail = async ({ to, subject, html }: { to: string, subject: string, html: string }) => {
  return resend.emails.send({
    from: process.env.MAIL_FROM ?? 'Mariachis Texas <onboarding@resend.dev>',
    to,
    subject,
    html,
  })
}

export default sendMail