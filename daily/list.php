<?php
/* 配送・集金管理システム V100.1 list.php
   受信側修正:
   1. 日報詳細に 業務開始時間・業務終了時間 を表示
   2. 日報集計に 本日の集金総額 を表示
   3. 配送完了一覧の各店舗 金額欄 を表示
*/
mb_internal_encoding('UTF-8');
date_default_timezone_set('Asia/Tokyo');

function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function arr($v) { return is_array($v) ? $v : []; }
function getv($a, $keys, $default = '') {
    if (!is_array($a)) return $default;
    foreach ((array)$keys as $k) {
        if (array_key_exists($k, $a) && $a[$k] !== '' && $a[$k] !== null) return $a[$k];
    }
    return $default;
}
function yen_num($n) {
    $n = (int)round((float)$n);
    return number_format($n) . '円';
}
function amount_value($v) {
    if (is_numeric($v)) return (float)$v;
    $s = preg_replace('/[^0-9\.-]/u', '', (string)$v);
    if ($s === '' || $s === '-' || $s === '.') return 0;
    return (float)$s;
}
function amount_text($row) {
    $status = (string)getv($row, ['collectionStatus','集金','状態','status'], '');
    $raw = getv($row, ['amountText','collectAmountText','collectionAmountText','moneyText','displayAmount','金額','集金金額','回収額','金額欄'], '');
    $num = amount_value(getv($row, ['amount','collectionAmount','collectAmount','money'], $raw));
    if ((string)$raw !== '') return h($raw);
    if ($num > 0) return h(yen_num($num));
    if (mb_strpos($status, '集金なし') !== false) return '0円';
    if (mb_strpos($status, '未集金') !== false) return '0円';
    return '－';
}
function find_rows($p) {
    foreach (['completedList','storeReports','dailyDetails','details','deliveryDetails','storeDetails','rows'] as $k) {
        if (isset($p[$k]) && is_array($p[$k]) && count($p[$k]) > 0) return $p[$k];
    }
    foreach (['m001','customerWork'] as $parent) {
        if (isset($p[$parent]) && is_array($p[$parent])) {
            foreach (['completedList','storeReports','dailyDetails','details','deliveryDetails','storeDetails','rows'] as $k) {
                if (isset($p[$parent][$k]) && is_array($p[$parent][$k]) && count($p[$parent][$k]) > 0) return $p[$parent][$k];
            }
        }
    }
    return [];
}
function label_value($p, $label) {
    foreach (['dailyDetailFields','detailFields','日報詳細'] as $k) {
        if (isset($p[$k]) && is_array($p[$k])) {
            foreach ($p[$k] as $x) {
                if (is_array($x) && isset($x['label']) && $x['label'] === $label) return getv($x, ['value','text'], '');
            }
        }
    }
    return '';
}
function work_time($p, $type) {
    $startKeys = ['workStartTime','businessStartTime','startTime','startAt','startedAt','業務開始時間'];
    $endKeys = ['workEndTime','businessEndTime','endTime','endAt','completedAt','業務終了時間','業務完了時間'];
    $keys = $type === 'start' ? $startKeys : $endKeys;
    $label = $type === 'start' ? '業務開始時間' : '業務終了時間';
    $v = getv($p, $keys, '');
    if ($v === '') $v = label_value($p, $label);
    foreach (['m001','customerWork','workTime','workTimeDetail'] as $parent) {
        if ($v === '' && isset($p[$parent]) && is_array($p[$parent])) {
            $v = getv($p[$parent], $keys, '');
            if ($v === '') $v = label_value($p[$parent], $label);
            if ($v === '' && ($parent === 'workTime' || $parent === 'workTimeDetail')) {
                $v = getv($p[$parent], $type === 'start' ? ['start','開始','業務開始時間'] : ['end','終了','業務終了時間'], '');
            }
        }
    }
    return $v ?: '－';
}
function total_collect_text($p, $rows) {
    $s = isset($p['summary']) && is_array($p['summary']) ? $p['summary'] : [];
    if (!$s && isset($p['m001']['summary']) && is_array($p['m001']['summary'])) $s = $p['m001']['summary'];
    if (!$s && isset($p['customerWork']['summary']) && is_array($p['customerWork']['summary'])) $s = $p['customerWork']['summary'];
    foreach (['todayTotalCollectAmountText','本日の合計集金総額','本日の集金総額','totalCollectAmountText','collectAmountText'] as $k) {
        if (isset($s[$k]) && $s[$k] !== '') return (string)$s[$k];
    }
    foreach (['todayTotalCollectAmount','totalCollectAmount','collectAmount'] as $k) {
        if (isset($s[$k]) && $s[$k] !== '') return yen_num(amount_value($s[$k]));
    }
    $sumRows = 0;
    foreach ($rows as $r) {
        $st = (string)getv($r, ['collectionStatus','集金','status','状態'], '');
        if (mb_strpos($st, '集金完了') !== false) {
            $sumRows += amount_value(getv($r, ['amount','collectionAmount','collectAmount','money','amountText','金額','集金金額'], 0));
        }
    }
    $sumCollectHistory = 0;
    $chs = [];
    if (isset($p['collectHistoryData']) && is_array($p['collectHistoryData'])) $chs = $p['collectHistoryData'];
    if (!$chs && isset($p['m001']['collectHistoryData']) && is_array($p['m001']['collectHistoryData'])) $chs = $p['m001']['collectHistoryData'];
    foreach ($chs as $x) $sumCollectHistory += amount_value(getv($x, ['amount','金額','collectAmount'], 0));
    return yen_num(max($sumRows, $sumCollectHistory));
}
function list_files() {
    $dir = __DIR__ . '/reports';
    if (!is_dir($dir)) return [];
    $files = glob($dir . '/*.json') ?: [];
    rsort($files);
    return $files;
}
function load_report($id) {
    $id = preg_replace('/[^0-9A-Za-z_\-]/', '', (string)$id);
    if ($id === '') return null;
    $file = __DIR__ . '/reports/' . $id . '.json';
    if (!is_file($file)) return null;
    $j = json_decode(file_get_contents($file), true);
    return is_array($j) ? $j : null;
}

$id = isset($_GET['id']) ? $_GET['id'] : '';
?><!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>配送・集金日報一覧 V100.1</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans JP',sans-serif;margin:0;background:#f5f6f8;color:#111;}
header{background:#111;color:#fff;padding:14px 16px;font-weight:800;}
main{padding:14px;max-width:1100px;margin:auto;}
.card{background:#fff;border:1px solid #ddd;border-radius:12px;padding:14px;margin:0 0 14px;box-shadow:0 1px 3px rgba(0,0,0,.04);}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;}
.box{border:2px solid #111;border-radius:10px;padding:12px;background:#fff;}
.label{font-size:13px;color:#555;margin-bottom:4px;}.value{font-size:22px;font-weight:900;}
table{width:100%;border-collapse:collapse;background:#fff;}th,td{border:1px solid #ccc;padding:8px;text-align:left;vertical-align:top;}th{background:#eee;}tr:nth-child(even) td{background:#fafafa;}
a{color:#0b57d0;text-decoration:none;font-weight:700}.muted{color:#666}.money{font-weight:900;white-space:nowrap}.toplink{display:inline-block;margin-bottom:12px;}
</style>
</head>
<body>
<header>配送・集金日報一覧 V100.1</header>
<main>
<?php if ($id !== ''): $p = load_report($id); ?>
  <a class="toplink" href="list.php">← 一覧へ戻る</a>
  <?php if (!$p): ?>
    <div class="card">日報が見つかりません。</div>
  <?php else: $rows = find_rows($p); ?>
    <section class="card">
      <h2>日報詳細</h2>
      <div class="grid">
        <div class="box"><div class="label">業務開始時間</div><div class="value"><?=h(work_time($p,'start'))?></div></div>
        <div class="box"><div class="label">業務終了時間</div><div class="value"><?=h(work_time($p,'end'))?></div></div>
        <div class="box"><div class="label">本日の集金総額</div><div class="value"><?=h(total_collect_text($p,$rows))?></div></div>
      </div>
    </section>
    <section class="card">
      <h2>基本情報</h2>
      <div>受信日時：<?=h(getv($p,['receivedAt'],'－'))?></div>
      <div>得意先：<?=h(getv($p,['customerCode'],'M001'))?> <?=h(getv($p,['customerName'],'株式会社松葉屋製麺'))?></div>
      <div>ドライバー：<?=h(trim(getv($p,['driverCode'],'').' '.getv($p,['driverName'],'')))?></div>
      <div>車両：<?=h(trim(getv($p,['vehicleCode'],'').' '.getv($p,['vehicleName'],'')))?></div>
      <div>端末：<?=h(trim(getv($p,['terminalCode'],'').' '.getv($p,['terminalName'],'')))?></div>
    </section>
    <section class="card">
      <h2>日報集計</h2>
      <?php $s = isset($p['summary']) && is_array($p['summary']) ? $p['summary'] : []; ?>
      <div class="grid">
        <div class="box"><div class="label">持出件数</div><div class="value"><?=h(getv($s,['carryCount'],'－'))?></div></div>
        <div class="box"><div class="label">配送完了件数</div><div class="value"><?=h(getv($s,['deliveryCount'],'－'))?></div></div>
        <div class="box"><div class="label">残件数</div><div class="value"><?=h(getv($s,['remainCount'],'－'))?></div></div>
        <div class="box"><div class="label">集金件数</div><div class="value"><?=h(getv($s,['collectCount'],'－'))?></div></div>
        <div class="box"><div class="label">本日の集金総額</div><div class="value"><?=h(total_collect_text($p,$rows))?></div></div>
        <div class="box"><div class="label">未集金件数</div><div class="value"><?=h(getv($s,['pendingCount'],'－'))?></div></div>
        <div class="box"><div class="label">未集金金額</div><div class="value"><?=h(getv($s,['pendingAmountText'],'－'))?></div></div>
        <div class="box"><div class="label">集金なし件数</div><div class="value"><?=h(getv($s,['noCollectCount'],'－'))?></div></div>
        <div class="box"><div class="label">配送不可件数</div><div class="value"><?=h(getv($s,['failCount'],'－'))?></div></div>
      </div>
    </section>
    <section class="card">
      <h2>配送完了一覧</h2>
      <table>
        <thead><tr><th>持出時間</th><th>配送完了時間</th><th>店舗コード</th><th>店舗名</th><th>状態</th><th>配送内容</th><th>金額</th><th>理由</th></tr></thead>
        <tbody>
        <?php if (!$rows): ?>
          <tr><td colspan="8" class="muted">配送完了一覧データがありません。</td></tr>
        <?php else: foreach ($rows as $r): ?>
          <tr>
            <td><?=h(getv($r,['carryTime','takeoutTime','carryOutTime','持出時間'],'－'))?></td>
            <td><?=h(getv($r,['deliveryTime','deliveryCompleteTime','deliveryCompletedTime','completedTime','deliveredAt','配送完了時間'],'－'))?></td>
            <td><?=h(getv($r,['code','店舗コード'],'－'))?></td>
            <td><?=h(getv($r,['name','店舗名'],'－'))?></td>
            <td><?=h(getv($r,['collectionStatus','集金','status','状態'],'－'))?></td>
            <td><?=h(getv($r,['deliveryContent','配送内容'],'－'))?></td>
            <td class="money"><?=amount_text($r)?></td>
            <td><?=h(getv($r,['reason','理由'],'－'))?></td>
          </tr>
        <?php endforeach; endif; ?>
        </tbody>
      </table>
    </section>
  <?php endif; ?>
<?php else: $files = list_files(); ?>
  <section class="card">
    <h2>日報一覧</h2>
    <table>
      <thead><tr><th>受信日時</th><th>得意先</th><th>ドライバー</th><th>本日の集金総額</th><th>詳細</th></tr></thead>
      <tbody>
      <?php if (!$files): ?>
        <tr><td colspan="5" class="muted">保存済みの日報がありません。</td></tr>
      <?php else: foreach ($files as $file): $rid = basename($file, '.json'); $p = json_decode(file_get_contents($file), true); if (!is_array($p)) $p=[]; $rows=find_rows($p); ?>
        <tr>
          <td><?=h(getv($p,['receivedAt'],date('Y-m-d H:i:s', filemtime($file))))?></td>
          <td><?=h(trim(getv($p,['customerCode'],'').' '.getv($p,['customerName'],'')))?></td>
          <td><?=h(trim(getv($p,['driverCode'],'').' '.getv($p,['driverName'],'')))?></td>
          <td class="money"><?=h(total_collect_text($p,$rows))?></td>
          <td><a href="list.php?id=<?=h($rid)?>">詳細を見る</a></td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </section>
<?php endif; ?>
</main>
</body>
</html>
