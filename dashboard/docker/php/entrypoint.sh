#!/bin/sh
set -e

# Create necessary directories
mkdir -p /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache

# Fix permissions for Laravel writable directories
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Install composer dependencies if vendor does not exist
if [ ! -f /var/www/html/vendor/autoload.php ]; then
    echo "vendor/autoload.php not found. Installing Composer dependencies..."
    composer install --optimize-autoloader --no-interaction
    chown -R www-data:www-data /var/www/html/vendor
fi

exec "$@"
