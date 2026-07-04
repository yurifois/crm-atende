#!/bin/bash
# Atualiza o crm-atende no servidor: baixa a versao nova e reconstroi.
# Uso no servidor: bash /root/crm-atende/deploy.sh
cd /root/crm-atende || exit 1
git pull && docker compose up -d --build
