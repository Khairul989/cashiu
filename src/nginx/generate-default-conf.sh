# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

APP_SERVICE=${APP_SERVICE:-cashback.tech}
APP_PORT=${PORT:-3333}

SERVER_NAME=${SERVER_NAME:-localhost}
NGINX_PORT=${NGINX_PORT:-80}
SSL_PORT=${NGINX_SSL_PORT:-443}

cd ./nginx/certs && mkcert "*.${APP_SERVICE}"

cd ./../conf && cat <<EOF > default.conf
server {
    listen 80;
    server_name ${APP_SERVICE};

    return  301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name ${APP_SERVICE};

    # Self signed certificates
    # Don't use them in a production server!
    ssl_certificate     /etc/nginx/ssl/_wildcard.${APP_SERVICE}.pem;
    ssl_certificate_key /etc/nginx/ssl/_wildcard.${APP_SERVICE}-key.pem;

    location / {
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        proxy_pass	http://app:${APP_PORT};
    }
}
EOF
