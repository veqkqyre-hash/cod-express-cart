<?php
// Copy to /home/swisskle/.dreame-backup-config.php (OUTSIDE the website folder), permissions 600.
// Never commit the real file to GitHub.
return [
    'cpanel_user'  => 'swisskle',
    'cpanel_token' => 'PASTE_CPANEL_API_TOKEN_HERE',   // cPanel → Security → Manage API Tokens
    'cpanel_host'  => 'https://127.0.0.1:2083',
    'home_dir'     => '/home/swisskle',
    'supabase_url' => 'https://eihuguhotpsaejckhdtl.supabase.co',
    'supabase_publishable_key' => 'sb_publishable_7xmOpsRaM7FcZMsDvar4zQ_amR_KIOt', // public key, safe
    'link_secret'  => 'PASTE_64_RANDOM_CHARACTERS_HERE', // used to sign 10-minute download links
    'allowed_origins' => [
        'https://cod-express-cart.lovable.app',
        'https://id-preview--af0b446d-a548-47df-b3c6-269e27c390c6.lovable.app',
    ],
];
