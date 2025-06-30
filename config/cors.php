<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://tripwise-front.vercel.app',
        'http://localhost:5173',
        'https://tosderleng.tech',
        'https://www.tosderleng.tech',
        'http://localhost:3000',
    ],
    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
