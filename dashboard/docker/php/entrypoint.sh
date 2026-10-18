#!/bin/sh
set -e

# Create necessary directories
mkdir -p /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache \
         /var/www/html/public/build

# Install when vendor is missing, or when composer.lock / a module composer.json
# is newer than the generated autoload. A running container otherwise keeps
# classmaps from the previous deploy and artisan exits before Vite can build.
composer_stale() {
    if [ ! -f /var/www/html/vendor/autoload.php ]; then
        return 0
    fi
    if [ /var/www/html/composer.lock -nt /var/www/html/vendor/autoload.php ]; then
        return 0
    fi
    for module_composer in /var/www/html/Modules/*/composer.json; do
        if [ -f "$module_composer" ] && [ "$module_composer" -nt /var/www/html/vendor/autoload.php ]; then
            return 0
        fi
    done
    return 1
}

if composer_stale; then
    echo "Composer dependencies are missing or out of date. Installing..."
    composer install --optimize-autoloader --no-interaction
    php artisan optimize:clear --no-interaction || true
fi

vite_stale() {
    if [ ! -f /var/www/html/public/build/manifest.json ]; then
        return 0
    fi
    if [ /var/www/html/package.json -nt /var/www/html/public/build/manifest.json ]; then
        return 0
    fi
    if [ -n "$(find /var/www/html/resources/js -type f -newer /var/www/html/public/build/manifest.json 2>/dev/null | head -n 1)" ]; then
        return 0
    fi
    return 1
}

if vite_stale; then
    echo "Vite assets are missing or out of date. Building Vite assets..."
    if [ ! -d /var/www/html/node_modules ]; then
        npm install
    fi
    npm run build
    php artisan optimize:clear --no-interaction || true
fi

# Ensure storage symlink exists
php artisan storage:link --no-interaction || true

# Fix permissions for Laravel writable directories
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public/build
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

exec "$@"
