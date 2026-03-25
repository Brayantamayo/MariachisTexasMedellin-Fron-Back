-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_email_fkey" FOREIGN KEY ("email") REFERENCES "usuario"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
