#!/bin/sh

set -e

# Ensure AUTH_MAP is set
if [ -z "$AUTH_MAP" ]; then
    echo "AUTH_MAP is not set. Editing nginx.conf to remove basic auth."
    sed -i 's/auth_basic/#auth_basic/g' /etc/nginx/conf.d/default.conf
else
    # Clear the existing .htpasswd file
    > /etc/nginx/.htpasswd

    # Set IFS to ';' and split AUTH_MAP into key-value pairs
    IFS=';'
    for pair in $AUTH_MAP; do
        user=$(echo $pair | cut -d= -f1)
        password=$(echo $pair | cut -d= -f2)
        htpasswd -bB /etc/nginx/.htpasswd $user $password
    done
    echo "Updated .htpasswd file"
fi

# Start Nginx
nginx -g "daemon off;"
