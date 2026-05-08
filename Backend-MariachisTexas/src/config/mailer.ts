import * as SibApiV3Sdk from '@sendinblue/client'

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!)

export const sendMail = async ({ to, subject, html }: { to: string, subject: string, html: string }) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()

  sendSmtpEmail.sender = { name: 'Mariachis Texas', email: process.env.MAIL_FROM_ADDRESS }
  sendSmtpEmail.to = [{ email: to }]
  sendSmtpEmail.subject = subject
  sendSmtpEmail.htmlContent = html

  return apiInstance.sendTransacEmail(sendSmtpEmail)
}

export default sendMail