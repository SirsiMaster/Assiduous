<?php
/**
 * API endpoint to trigger metrics calculation
 * Called by the dashboard to ensure fresh data
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Change to repository root
$repoRoot = dirname(dirname(dirname(__FILE__)));
chdir($repoRoot);

// Check if metrics script exists
$scriptPath = 'scripts/calculate_accurate_metrics.js';
if (!file_exists($scriptPath)) {
    http_response_code(404);
    echo json_encode(['error' => 'Metrics script not found']);
    exit;
}

// Run the metrics calculation
$output = [];
$returnCode = 0;
exec('node ' . escapeshellarg($scriptPath) . ' 2>&1', $output, $returnCode);

if ($returnCode === 0) {
    // Read the generated cache file
    $cacheFile = 'admin/development/metrics_cache.json';
    if (file_exists($cacheFile)) {
        $metrics = json_decode(file_get_contents($cacheFile), true);
        echo json_encode([
            'success' => true,
            'metrics' => $metrics,
            'updated' => date('c')
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Metrics calculated but cache not found'
        ]);
    }
} else {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to calculate metrics',
        'output' => implode("\n", $output)
    ]);
}
?>
