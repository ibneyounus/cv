<?php
declare(strict_types=1);
/* Contact form handler. Needs config.php (copy of config.php.example).
   Safe by design: without config.php it answers "not_configured" and the website falls back to the email button. */
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function out(int $code, array $data): void { http_response_code($code); echo json_encode($data); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['ok' => false, 'error' => 'method']);

$cfgFile = __DIR__ . '/config.php';
if (!is_file($cfgFile)) out(503, ['ok' => false, 'error' => 'not_configured']);
$cfg = require $cfgFile;
$haveDb   = !empty($cfg['db_name']);
$haveMail = !empty($cfg['notify_to']);
if (!$haveDb && !$haveMail) out(503, ['ok' => false, 'error' => 'not_configured']);

// Spam protection 1: hidden field must stay empty
if (!empty($_POST['website'])) out(200, ['ok' => true]);           // pretend success to bots
// Spam protection 2: forms sent too quickly
$t = (int)($_POST['t'] ?? 0);
if ($t > 0 && (time() - intdiv($t, 1000)) < (int)($cfg['min_seconds'] ?? 4)) out(429, ['ok' => false, 'error' => 'too_fast']);

$clean = static fn(string $v, int $max): string => mb_substr(trim(strip_tags($v)), 0, $max);
$name    = $clean((string)($_POST['name'] ?? ''), 120);
$email   = $clean((string)($_POST['email'] ?? ''), 190);
$subject = $clean((string)($_POST['subject'] ?? ''), 190);
$message = $clean((string)($_POST['message'] ?? ''), 5000);
if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) out(422, ['ok' => false, 'error' => 'invalid']);
$subject = str_replace(["\r", "\n"], ' ', $subject);                 // block header injection
$name    = str_replace(["\r", "\n"], ' ', $name);

$ipHash = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . 'salt-change-me');
$pdo = null;
if ($haveDb) {
  try {
    $pdo = new PDO("mysql:host={$cfg['db_host']};dbname={$cfg['db_name']};charset=utf8mb4", $cfg['db_user'], $cfg['db_pass'],
      [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    // Spam protection 3: limit per visitor per hour
    $q = $pdo->prepare('SELECT COUNT(*) FROM contact_messages WHERE ip_hash = ? AND created_at > (NOW() - INTERVAL 1 HOUR)');
    $q->execute([$ipHash]);
    if ((int)$q->fetchColumn() >= (int)($cfg['max_per_hour'] ?? 5)) out(429, ['ok' => false, 'error' => 'limit']);
    $pdo->prepare('INSERT INTO contact_messages (name,email,subject,message,ip_hash) VALUES (?,?,?,?,?)')
        ->execute([$name, $email, $subject, $message, $ipHash]);
  } catch (Throwable $e) {
    error_log('contact.php db: ' . $e->getMessage());
    if (!$haveMail) out(500, ['ok' => false, 'error' => 'server']);   // email can still save the message
  }
}
if ($haveMail) {
  $body = "Name: $name\nEmail: $email\n\n$message\n";
  $headers = "From: " . ($cfg['mail_from'] ?? 'no-reply@localhost') . "\r\nReply-To: $email\r\nContent-Type: text/plain; charset=UTF-8";
  $sent = @mail($cfg['notify_to'], '=?UTF-8?B?' . base64_encode('Website message: ' . ($subject ?: $name)) . '?=', $body, $headers);
  if (!$sent && !$pdo) out(500, ['ok' => false, 'error' => 'server']);
}
out(200, ['ok' => true]);
