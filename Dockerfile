FROM node:20.12.2-alpine3.18 AS base
WORKDIR /IA
ARG WEB_PORT=3333
ARG DOMAIN=0.0.0.0
ENV PORT $WEB_PORT
ENV CADDY_DOMAIN $DOMAIN
RUN apk add --no-cache tzdata curl aws-cli caddy bind-tools dnsmasq && \
    cp /usr/share/zoneinfo/Asia/Kuala_Lumpur /etc/localtime && \
    echo "PS1='\u@\[\e[1;32m\]\h\[\e[m\]:\w$ '" | tee -a /etc/profile && \
    echo "alias ls='ls --color=always --group-directories-first'" | tee -a /etc/profile && \
    echo "alias ll='ls -lah --color=always --group-directories-first'" | tee -a /etc/profile && \
    echo "alias l='ls -lA --color=always --group-directories-first'" | tee -a /etc/profile && \
    echo "alias rm='rm -i'" | tee -a /etc/profile && \
    echo "alias cp='cp -i'" | tee -a /etc/profile && \
    echo "alias mv='mv -i'" | tee -a /etc/profile && \
    echo "alias grep='grep --color=auto'" | tee -a /etc/profile

FROM base as production-deps
WORKDIR /IA
ADD src/.npmrc src/package.json src/package-lock.json ./
RUN npm install
RUN npm install pm2 -g && pm2 update

# Build stage
FROM base as node-build
WORKDIR /IA
COPY --from=production-deps /IA/node_modules /IA/node_modules
ADD src/. .
RUN node ace build

FROM base as npm-omit
WORKDIR /IA
COPY --from=production-deps /IA/node_modules /IA/node_modules
COPY --from=node-build /IA/build /IA
COPY --from=node-build /IA/payloads /IA/payloads
RUN npm ci --omit="dev" --legacy-peer-deps

FROM base
ENV NODE_ENV=production
WORKDIR /IA
COPY --from=production-deps /usr/local/lib/node_modules/pm2 /usr/local/lib/node_modules/pm2
COPY --from=npm-omit /IA/ ./.
COPY src/swagger.json ./swagger.json
RUN ln -s /usr/local/lib/node_modules/pm2/bin/pm2 /usr/local/bin/pm2 && \
    touch ecosystem.config.cjs && \
    echo "module.exports = { apps: [{name: 'cashback', script: '/IA/bin/server.js', args: 'start --port 3333', cwd: '/IA/', out_file: '/proc/self/fd/1', error_file: '/proc/self/fd/2', max_memory_restart: '1500M' }] };" | tee ecosystem.config.cjs

CMD ["/usr/local/bin/pm2", "start", "ecosystem.config.cjs", "&", "caddy", "reverse-proxy", "--from ${CADDY_DOMAIN}:80", "--to localhost:${PORT}"]
