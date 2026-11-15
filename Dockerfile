# Imagem oficial do Playwright: já traz o Chromium e as bibliotecas de sistema que ele precisa para
# gerar os PDFs de relatório. A tag TEM que ser a mesma versão do pacote "playwright" no package.json
# (fixada sem ^): cada versão do pacote procura o build do Chromium que veio junto com ela.
FROM mcr.microsoft.com/playwright:v1.65.1-noble

WORKDIR /app

COPY package.json package-lock.json ./
# Instala as devDependencies também: o build usa tsc e as migrations rodam com ts-node.
RUN npm ci --include=dev

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
