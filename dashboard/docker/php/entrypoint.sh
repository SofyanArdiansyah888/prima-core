#!/bin/sh
set -e

# Create necessary directories
mkdir -p /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache \
         /var/www/html/public/build

# Install composer dependencies if vendor does not exist
if [ ! -f /var/www/html/vendor/autoload.php ]; then
    echo "vendor/autoload.php not found. Installing Composer dependencies..."
    composer install --optimize-autoloader --no-interaction
fi

# Build Vite frontend assets if manifest.json is missing
if [ ! -f /var/www/html/public/build/manifest.json ]; then
    echo "public/build/manifest.json not found. Building Vite assets..."
    if [ ! -d /var/www/html/node_modules ]; then
        npm install
    fi
    npm run build
fi

# Fix permissions for Laravel writable directories
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public/build
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

exec "$@"
