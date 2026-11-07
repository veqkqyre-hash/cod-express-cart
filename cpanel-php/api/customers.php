<?php
declare(strict_types=1);

/**
 * cPanel PHP bridge for the Admin > Klientët screen.
 * Not used by the TanStack frontend until its client calls are migrated.
 * SUPABASE_SERVICE_ROLE_KEY must be supplied ONLY as a server environment variable.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function answer(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') answer(405, ['error'=>'Method not allowed']);
if (!function_exists('curl_init')) answer(503, ['error'=>'PHP cURL extension is required']);
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && strtolower((string)parse_url($origin, PHP_URL_HOST)) !== strtolower((string)preg_replace('/:\\d+$/','',$host))) {
    answer(403, ['error'=>'Origin denied']);
}
$serviceKey = getenv('SUPABASE_SERVICE_ROLE_KEY') ?: '';
$url = rtrim(getenv('SUPABASE_URL') ?: '', '/');
$publicKey = getenv('SUPABASE_PUBLISHABLE_KEY') ?: '';
if (!$serviceKey || !$url || !$publicKey || !preg_match('~^https://[^/]+$~', $url)) {
    answer(503, ['error'=>'PHP backend is not configured']);
}
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if (!preg_match('/^Bearer\\s+([^\\s]+)$/i', $auth, $matches)) answer(401,['error'=>'Authentication required']);
$jwt = $matches[1];
$raw = file_get_contents('php://input') ?: '';
if (strlen($raw) > 2048) answer(413, ['error'=>'Request too large']);
$input = json_decode($raw ?: '{}', true);
if (!is_array($input)) answer(400,['error'=>'Invalid JSON']);

function supabase(string $url, string $method, string $apiKey, string $bearer, ?array $body = null): array {
    $ch = curl_init($url);
    $headers = ['apikey: '.$apiKey, 'Authorization: Bearer '.$bearer, 'Accept: application/json'];
    if ($body !== null) $headers[] = 'Content-Type: application/json';
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER=>true,
        CURLOPT_CUSTOMREQUEST=>$method,
        CURLOPT_HTTPHEADER=>$headers,
        CURLOPT_CONNECTTIMEOUT=>5,
        CURLOPT_TIMEOUT=>15,
    ]);
    if ($body !== null) curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($body));
    $response = curl_exec($ch);
    $status = (int)curl_getinfo($ch,CURLINFO_HTTP_CODE);
    curl_close($ch);
    $decoded = json_decode(is_string($response) ? $response : '',true);
    return [$status, is_array($decoded) ? $decoded : [], is_string($response) ? trim($response) : ''];
}

[$status,$user] = supabase($url.'/auth/v1/user','GET',$publicKey,$jwt);
if ($status !== 200 || empty($user['id'])) answer(401,['error'=>'Invalid session']);
$userId = $user['id'];
[$status,$role,$roleRaw] = supabase($url.'/rest/v1/rpc/has_role','POST',$publicKey,$jwt,['_user_id'=>$userId,'_role'=>'admin']);
if ($status !== 200 || $roleRaw !== 'true') answer(403,['error'=>'Admin permission required']);

$action = $input['action'] ?? '';
if ($action === 'list') {
    [$status,$usersResponse] = supabase($url.'/auth/v1/admin/users?page=1&per_page=200','GET',$serviceKey,$serviceKey);
    if ($status !== 200 || !isset($usersResponse['users']) || !is_array($usersResponse['users'])) answer(502,['error'=>'Could not load customers']);
    $users = $usersResponse['users'];
    $ids = array_column($users,'id');
    if (!$ids) answer(200,[]);
    $filter = '('.implode(',',array_map('rawurlencode',$ids)).')';
    [$status,$orders] = supabase($url.'/rest/v1/orders?select=user_id,total&user_id=in.'.rawurlencode($filter).'&limit=10000','GET',$serviceKey,$serviceKey);
    if ($status !== 200 || !array_is_list($orders)) answer(502,['error'=>'Could not load orders']);
    $totals=[];
    foreach ($orders as $o) {
        $id=$o['user_id']??null;
        if (!is_string($id)) continue;
        if (!isset($totals[$id])) $totals[$id]=['orders'=>0,'total'=>0];
        $totals[$id]['orders']++;
        $totals[$id]['total']+=(float)($o['total']??0);
    }
    $out=[];
    foreach ($users as $u) {
        $id=$u['id']??null;
        if (!is_string($id)) continue;
        $t=$totals[$id]??['orders'=>0,'total'=>0];
        $out[]=[
            'id'=>$id, 'email'=>$u['email']??null,
            'created_at'=>$u['created_at']??null, 'last_sign_in_at'=>$u['last_sign_in_at']??null,
            'confirmed'=>!empty($u['email_confirmed_at']), 'orders'=>$t['orders'],'total'=>$t['total']
        ];
    }
    answer(200,$out);
}
if ($action === 'delete') {
    $target=$input['userId']??null;
    if (!is_string($target) || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',$target)) answer(400,['error'=>'Invalid user ID']);
    if ($target === $userId) answer(400,['error'=>'Cannot delete your own account']);
    [$status] = supabase($url.'/auth/v1/admin/users/'.rawurlencode($target),'DELETE',$serviceKey,$serviceKey);
    if ($status < 200 || $status >= 300) answer(502,['error'=>'Could not delete customer']);
    answer(200,['ok'=>true]);
}
answer(400,['error'=>'Unknown action']);
