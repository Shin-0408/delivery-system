<?php
/* 配送・集金管理システム V100.1 receive.php
   受信側：text/plain JSON / application/json / form POST を正しく受信して reports/*.json に保存。
*/
mb_internal_encoding('UTF-8');
date_default_timezone_set('Asia/Tokyo');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

function respond_json($ok, $data = []) {
    echo json_encode(array_merge(['ok' => $ok], $data), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function decode_json_string($v) {
    if (is_array($v)) return $v;
    if (!is_string($v)) return null;
    $s = trim($v);
    if ($s === '') return null;
    $j = json_decode($s, true);
    return (json_last_error() === JSON_ERROR_NONE && is_array($j)) ? $j : null;
}
function pick_payload() {
    $raw = file_get_contents('php://input');

    // V100系の送信は Content-Type:text/plain で JSON文字列。必ず最初にJSONとして読む。
    $json = decode_json_string($raw);
    if ($json) return $json;

    if (!empty($_POST)) {
        foreach (['payload','data','json','reportData','dailyPayload','body','text','message','report'] as $k) {
            if (isset($_POST[$k])) {
                $j = decode_json_string($_POST[$k]);
                if ($j) return $j;
            }
        }
        return $_POST;
    }

    if (is_string($raw) && trim($raw) !== '') {
        parse_str($raw, $form);
        if (!empty($form)) {
            foreach (['payload','data','json','reportData','dailyPayload','body','text','message','report'] as $k) {
                if (isset($form[$k])) {
                    $j = decode_json_string($form[$k]);
                    if ($j) return $j;
                }
            }
            return $form;
        }
    }
    return ['rawBody' => $raw];
}
function normalize_payload($p) {
    if (!is_array($p)) $p = ['rawBody' => (string)$p];
    foreach (['payload','data','json','reportData','dailyPayload'] as $k) {
        if (isset($p[$k])) {
            $j = decode_json_string($p[$k]);
            if ($j) { $p = array_merge($p, $j); break; }
        }
    }
    if (empty($p['receivedAt'])) $p['receivedAt'] = date('Y-m-d H:i:s');
    $p['receiveVersion'] = 'V100.1';
    return $p;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond_json(false, ['message' => 'POST only']);
}

$payload = normalize_payload(pick_payload());
$dir = __DIR__ . '/reports';
if (!is_dir($dir) && !mkdir($dir, 0775, true)) {
    respond_json(false, ['message' => '保存フォルダを作成できません']);
}
$id = date('Ymd_His') . '_' . substr(bin2hex(random_bytes(4)), 0, 8);
$file = $dir . '/' . $id . '.json';
$json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
if (file_put_contents($file, $json, LOCK_EX) === false) {
    respond_json(false, ['message' => '日報を保存できません']);
}
respond_json(true, ['message' => '日報を受信しました', 'id' => $id, 'saved' => basename($file)]);
