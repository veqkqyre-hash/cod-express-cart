<?php
declare(strict_types=1);
/**
 * Dreame Beauty Cosmetics — Admin > Backup & Restore bridge to cPanel's own backup system.
 * Upload to:  /home/swisskle/dreamebeautycosmetics.com/api/website-backup.php
 * Secrets live ONLY in the config file outside the website folder (see BACKUP-SETUP.md).
 * Only signed-in Admins (checked live against the database role) may use it.
 */
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function answer(int $status, array $data): never {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$configPath = getenv('DREAME_BACKUP_CONFIG') ?: '/home/swisskle/.dreame-backup-config.php';
$cfg = is_file($configPath) ? (require $configPath) : null;
if (!is_array($cfg)) answer(503, ['error' => 'Nuk është konfiguruar: mungon skedari i konfigurimit']);
foreach (['cpanel_user','cpanel_token','supabase_url','supabase_publishable_key','link_secret'] as $k) {
    if (empty($cfg[$k]) || !is_string($cfg[$k])) answer(503, ['error' => "Nuk është konfiguruar: mungon $k"]);
}
if (strlen($cfg['link_secret']) < 32) answer(503, ['error' => 'link_secret duhet të ketë të paktën 32 shenja']);
$home = rtrim((string)($cfg['home_dir'] ?? '/home/'.$cfg['cpanel_user']), '/');
$cpHost = rtrim((string)($cfg['cpanel_host'] ?? 'https://127.0.0.1:2083'), '/');
$sbUrl = rtrim($cfg['supabase_url'], '/');
$sbKey = $cfg['supabase_publishable_key'];
$NAME_RE = '/^backup-[0-9][0-9.\-_]*_[a-z0-9_]+\.tar\.gz$/';

function list_backups(string $home, string $re): array {
    $out = [];
    foreach (glob($home.'/backup-*.tar.gz') ?: [] as $f) {
        $b = basename($f);
        if (!preg_match($re, $b) || !is_file($f)) continue;
        $out[] = ['name' => $b, 'size' => filesize($f) ?: 0, 'modified' => gmdate('c', filemtime($f) ?: 0)];
    }
    usort($out, fn($a, $b) => strcmp($b['modified'], $a['modified']));
    return $out;
}

// ---------- Signed download (GET) — link is valid 10 minutes and only for one file ----------
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET' && isset($_GET['dl'])) {
    $name = basename((string)$_GET['dl']);
    $exp = (int)($_GET['exp'] ?? 0);
    $sig = (string)($_GET['sig'] ?? '');
    $good = hash_hmac('sha256', $name.'|'.$exp, $cfg['link_secret']);
    if (!preg_match($NAME_RE, $name) || $exp < time() || !hash_equals($good, $sig)) answer(403, ['error' => 'Linku ka skaduar ose nuk është i vlefshëm']);
    $path = $home.'/'.$name;
    if (!is_file($path)) answer(404, ['error' => 'Backup-i nuk u gjet']);
    @set_time_limit(0);
    while (ob_get_level()) ob_end_clean();
    header('Content-Type: application/gzip');
    header('Content-Length: '.filesize($path));
    header('Content-Disposition: attachment; filename="'.$name.'"');
    readfile($path);
    exit;
}

// ---------- CORS for the Admin panel ----------
$allowed = array_merge(['https://dreamebeautycosmetics.com','https://www.dreamebeautycosmetics.com'], (array)($cfg['allowed_origins'] ?? []));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    if (!in_array($origin, $allowed, true)) answer(403, ['error' => 'Origin denied']);
    header('Access-Control-Allow-Origin: '.$origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') answer(405, ['error' => 'Method not allowed']);
if (!function_exists('curl_init')) answer(503, ['error' => 'Mungon PHP cURL']);

function http_json(string $url, string $method, array $headers, ?array $body = null, bool $local = false): array {
    $ch = curl_init($url);
    if ($body !== null) $headers[] = 'Content-Type: application/json';
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $headers, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 30]);
    if ($local) { curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0); curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); }
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    $raw = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $raw = is_string($raw) ? trim($raw) : '';
    $j = json_decode($raw, true);
    return [$status, is_array($j) ? $j : [], $raw];
}

// ---------- Admin check (live, against the database) ----------
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (!preg_match('/^Bearer\s+(\S+)$/i', $auth, $m)) answer(401, ['error' => 'Duhet kyçje']);
$jwt = $m[1];
[$st, $user] = http_json($sbUrl.'/auth/v1/user', 'GET', ['apikey: '.$sbKey, 'Authorization: Bearer '.$jwt]);
if ($st !== 200 || empty($user['id'])) answer(401, ['error' => 'Sesion i pavlefshëm']);
[$st, , $raw] = http_json($sbUrl.'/rest/v1/rpc/has_role', 'POST', ['apikey: '.$sbKey, 'Authorization: Bearer '.$jwt], ['_user_id' => $user['id'], '_role' => 'admin']);
if ($st !== 200 || $raw !== 'true') answer(403, ['error' => 'Vetëm administratori']);

$input = json_decode(file_get_contents('php://input') ?: '{}', true);
$action = is_array($input) ? ($input['action'] ?? '') : '';
$isLocal = (bool)preg_match('~^https://(127\.0\.0\.1|localhost)(:\d+)?$~', $cpHost);
$uapi = fn(string $mod, string $fn) => http_json("$cpHost/execute/$mod/$fn", 'GET', ['Authorization: cpanel '.$cfg['cpanel_user'].':'.$cfg['cpanel_token']], null, $isLocal);

if ($action === 'status') {
    [$st, $j] = $uapi('Backup', 'list_backups');
    $ok = $st === 200 && (int)($j['status'] ?? 0) === 1;
    answer(200, ['configured' => true, 'cpanel_ok' => $ok, 'backups' => list_backups($home, $NAME_RE),
                 'error' => $ok ? null : 'cPanel nuk e pranoi API token-in ('.($j['errors'][0] ?? "HTTP $st").')']);
}
if ($action === 'create') {
    [$st, $j] = $uapi('Backup', 'fullbackup_to_homedir');
    if ($st !== 200 || (int)($j['status'] ?? 0) !== 1) answer(502, ['error' => 'cPanel refuzoi: '.($j['errors'][0] ?? "HTTP $st")]);
    answer(200, ['ok' => true, 'message' => 'cPanel filloi backup-in e plotë. Shfaqet në listë kur të përfundojë (zakonisht disa minuta).']);
}
if ($action === 'link') {
    $name = basename((string)($input['name'] ?? ''));
    if (!preg_match($NAME_RE, $name) || !is_file($home.'/'.$name)) answer(404, ['error' => 'Backup-i nuk u gjet']);
    $exp = time() + 600;
    $sig = hash_hmac('sha256', $name.'|'.$exp, $cfg['link_secret']);
    $self = 'https://'.($_SERVER['HTTP_HOST'] ?? 'dreamebeautycosmetics.com').strtok($_SERVER['REQUEST_URI'] ?? '/api/website-backup.php', '?');
    answer(200, ['url' => $self.'?dl='.rawurlencode($name).'&exp='.$exp.'&sig='.$sig]);
}
answer(400, ['error' => 'Veprim i panjohur']);
