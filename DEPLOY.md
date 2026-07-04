# Guia de Deploy — crm-atende (Hostinger VPS)

Sobe tudo num VPS: app + Postgres + Redis + Evolution, com um comando.
Feito para nao-tecnicos: siga na ordem.

---

## 1. Contratar o VPS na Hostinger

- Acesse hostinger.com.br → **VPS**.
- Plano sugerido: **KVM 2** (2 vCPU, 8 GB RAM) — folga para varios WhatsApps.
- Sistema operacional: escolha o template **"Ubuntu 24.04 com Docker"** (ja vem com Docker instalado). Se nao houver, escolha **Ubuntu 24.04** puro (instala Docker no passo 3).
- Defina uma senha de root e anote o **IP do servidor**.

## 2. Conectar no servidor

Na Hostinger, use o **Terminal do navegador** (botao no painel do VPS) — nao precisa instalar nada.
Ou, se preferir, via SSH: `ssh root@SEU_IP`.

## 3. Instalar o Docker (pule se o template ja veio com Docker)

```bash
curl -fsSL https://get.docker.com | sh
```

## 4. Colocar o codigo no servidor

Recomendado (via GitHub — tambem facilita atualizacoes futuras):
```bash
git clone SEU_REPOSITORIO crm-atende
cd crm-atende
```
> Se o projeto ainda nao esta no GitHub, me peca que eu te ajudo a subir num
> repositorio privado. Alternativa: enviar a pasta por SFTP (FileZilla).

## 5. Configurar as variaveis

```bash
cp .env.example .env
nano .env
```
Preencha cada valor (senhas fortes, sua chave do Gemini, IP do VPS em SERVER_URL).
Salve no nano com **Ctrl+O**, Enter, e saia com **Ctrl+X**.

## 6. Subir tudo

```bash
docker compose up -d --build
```
A primeira vez demora alguns minutos (baixa imagens e faz o build do app).
As migracoes do banco rodam sozinhas.

Ver se subiu:
```bash
docker compose ps
docker compose logs -f app
```

## 7. Acessar o painel

No navegador: `http://SEU_IP:3000`
Vai pedir usuario e senha (Basic Auth): usuario qualquer, senha = **ADMIN_PASSWORD** do .env.

## 8. Conectar o WhatsApp

No painel, aba **WhatsApp** → **Conectar numero** → escaneie o QR. Pronto: o robo
responde sozinho, 24/7, mesmo com seu PC desligado.

---

## Manutencao

- Atualizar apos mudancas no codigo:
  ```bash
  git pull && docker compose up -d --build
  ```
- Ver logs: `docker compose logs -f app`
- Reiniciar: `docker compose restart`
- Parar: `docker compose down` (os dados ficam salvos nos volumes)

## Recomendado depois (seguranca)

- Apontar um **dominio** para o IP e colocar **HTTPS** (ex: com Caddy ou Nginx +
  Let's Encrypt) — deixa o acesso seguro e com cadeado. Posso montar isso quando chegar a hora.
- Manter o `.env` fora do git (ja esta no .gitignore).
