<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Change to project root
chdir('/Users/thekryptodragon/Development/assiduous');

// Get real-time metrics from git
$metrics = [
    'lastUpdated' => date('c'),
    'recentCommits' => [],
    'project' => [
        'totalCommits' => (int)trim(shell_exec('git rev-list --count HEAD')),
        'totalFiles' => (int)trim(shell_exec('git ls-files | wc -l')),
        'activeDays' => (int)trim(shell_exec('git log --all --pretty=format:"%ad" --date=short | sort -u | wc -l')),
        'linesAdded' => 0,
        'linesDeleted' => 0
    ],
    'today' => [
        'date' => date('Y-m-d'),
        'commits' => (int)trim(shell_exec('git log --since="today 00:00" --oneline | wc -l')),
        'hours' => 0,
        'cost' => 0
    ],
    'thisWeek' => [
        'commits' => (int)trim(shell_exec('git log --since="7 days ago" --oneline | wc -l')),
        'hours' => 0,
        'cost' => 0
    ],
    'thisMonth' => [
        'commits' => (int)trim(shell_exec('git log --since="30 days ago" --oneline | wc -l')),
        'hours' => 0,
        'cost' => 0
    ]
];

// Calculate hours and costs
$hoursPerCommit = 0.33;
$hourlyRate = 150;

$metrics['project']['totalHours'] = round($metrics['project']['totalCommits'] * $hoursPerCommit, 1);
$metrics['project']['totalCost'] = (int)($metrics['project']['totalHours'] * $hourlyRate);
$metrics['project']['avgHoursPerDay'] = round($metrics['project']['totalHours'] / max($metrics['project']['activeDays'], 1), 1);
$metrics['project']['velocity'] = round($metrics['project']['totalCommits'] / max($metrics['project']['activeDays'], 1), 1);

$metrics['today']['hours'] = round($metrics['today']['commits'] * $hoursPerCommit, 1);
$metrics['today']['cost'] = (int)($metrics['today']['hours'] * $hourlyRate);

$metrics['thisWeek']['hours'] = round($metrics['thisWeek']['commits'] * $hoursPerCommit, 1);
$metrics['thisWeek']['cost'] = (int)($metrics['thisWeek']['hours'] * $hourlyRate);

$metrics['thisMonth']['hours'] = round($metrics['thisMonth']['commits'] * $hoursPerCommit, 1);
$metrics['thisMonth']['cost'] = (int)($metrics['thisMonth']['hours'] * $hourlyRate);

// Get recent commits (real data)
$gitLog = shell_exec('git log -10 --pretty=format:"%H|%an|%ae|%at|%s"');
$lines = explode("\n", trim($gitLog));

foreach ($lines as $line) {
    if (empty($line)) continue;
    list($hash, $author, $email, $timestamp, $message) = explode('|', $line, 5);
    
    $secondsAgo = time() - (int)$timestamp;
    $timeAgo = '';
    
    if ($secondsAgo < 60) $timeAgo = 'just now';
    elseif ($secondsAgo < 3600) $timeAgo = floor($secondsAgo / 60) . ' minutes ago';
    elseif ($secondsAgo < 86400) $timeAgo = floor($secondsAgo / 3600) . ' hours ago';
    else $timeAgo = floor($secondsAgo / 86400) . ' days ago';
    
    $metrics['recentCommits'][] = [
        'id' => substr($hash, 0, 7),
        'hash' => $hash,
        'author' => $author,
        'email' => $email,
        'timestamp' => (int)$timestamp,
        'date' => date('Y-m-d H:i:s', $timestamp),
        'message' => $message,
        'timeAgo' => $timeAgo
    ];
}

echo json_encode($metrics, JSON_PRETTY_PRINT);
