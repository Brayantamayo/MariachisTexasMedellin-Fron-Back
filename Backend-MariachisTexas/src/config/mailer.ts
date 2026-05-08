// Sin dependencias externas, usa fetch nativo de Node.js 18+
export const sendMail = async ({ to, subject, html }: { to: string, subject: string, html: string }) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: {
        name: 'Mariachis Texas',
        email: process.env.MAIL_FROM_ADDRESS,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('❌ Error Brevo:', error)
    throw new Error(`Brevo error: ${error.message}`)
  }

  return response.json()
}

export default sendMail