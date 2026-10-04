#!/bin/sh
set -e

# Install composer dependencies if vendor does not exist
if [ ! -f /var/www/html/vendor/autoload.php ]; then
    echo "Installing Composer dependencies..."
    composer install --optimize-autoloader --no-interaction
fi

# Ensure storage and bootstrap/cache permissions
mkdir -p /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache

exec "$@"
