# Use official PHP image with Apache
FROM php:8.2-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    zip unzip curl libzip-dev libpng-dev libonig-dev libxml2-dev git \
    && docker-php-ext-install pdo_mysql zip

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy project files
COPY . /var/www/html

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install Laravel dependencies
RUN composer install --no-dev --optimize-autoloader

# Set correct permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Expose port 80
EXPOSE 80
