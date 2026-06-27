<?php
/* 配送・集金管理システム V100.1 receive.php
   受信側修正: JSON保存を安定化。list.phpで業務時間・本日の集金総額・配送完了一覧金額を表示できる形で保存。
*/
mb_internal_encoding('UTF-8');
date_default_timezone_set('Asia/Tokyo');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

function respond($ok, $data = []) {
    echo json_encode(array_merge(['ok' => $ok], $data), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function deep_decode($v) {
    if (is_array($v)) return $v;
    if (!is_string($v)) return $v;
    $s = trim($v);
    if ($s === '') return $v;
    $j = json_decode($s, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($j)) return $j;
    return $v;
}
function pick_payload() {
    $raw = file_get_contents('php://input');
    $payload = null;
    $ct = isset($_SERVER['CONTENT_TYPE']) ? strtolower($_SERVER['CONTENT_TYPE']) : '';

    if (strpos($ct, 'application/json') !== false) {
        $j = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($j)) $payload = $j;
    }
    if (!$payload && !empty($_POST)) {
        foreach (['payload','data','json','reportData','dailyPayload','body','text','message','report'] as $k) {
            if (isset($_POST[$k])) {
                $decoded = deep_decode($_POST[$k]);
                if (is_array($decoded)) { $payload = $decoded; break; }
            }
        }
        if (!$payload) $payload = $_POST;
    }
    if (!$payload && is_string($raw) && trim($raw) !== '') {
        parse_str($raw, $form);
        if (!empty($form)) {
            foreach (['payload','data','json','reportData','dailyPayload','body','text','message','report'] as $k) {
                if (isset($form[$k])) {
                    $decoded = deep_decode($form[$k]);
                    if (is_array($decoded)) { $payload = $decoded; break; }
                }
            }
            if (!$payload) $payload = $form;
        } else {
            $j = json_decode($raw, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($j)) $payload = $j;
        }
    }
    if (!$payload) $payload = ['rawBody' => $raw];
    return $payload;
}
function normalize_payload($p) {
    if (!is_array($p)) $p = ['raw' => $p];
    foreach (['payload','data','json','reportData','dailyPayload'] as $k) {
        if (isset($p[$k])) {
            $d = deep_decode($p[$k]);
            if (is_array($d)) { $p = array_merge($p, $d); break; }
        }
    }
    $p['receivedAt'] = date('Y-m-d H:i:s');
    $p['receiveVersion'] = 'V100.1';
    return $p;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, ['message' => 'POST only']);
}

$payload = normalize_payload(pick_payload());
$dir = __DIR__ . '/reports';
if (!is_dir($dir) && !mkdir($dir, 0775, true)) {
    respond(false, ['message' => '保存フォルダを作成できません']);
}
$id = date('Ymd_His') . '_' . substr(bin2hex(random_bytes(4)), 0, 8);
$file = $dir . '/' . $id . '.json';
$json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
if (file_put_contents($file, $json, LOCK_EX) === false) {
    respond(false, ['message' => '日報を保存できません']);
}
respond(true, ['message' => '日報を受信しました', 'id' => $id, 'saved' => basename($file)]);
