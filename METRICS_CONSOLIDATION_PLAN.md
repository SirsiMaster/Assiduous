# Metrics Files Consolidation Plan

## PROBLEM
Multiple conflicting metrics JSON files scattered across repo

## SINGLE SOURCE OF TRUTH
`public/admin/development/metrics.json`

## FILES TO DELETE
- metrics_cache_backup.json (root - old backup)
- metrics_cache_enhanced.json (root - duplicate)
- public/admin/development/metrics_realtime.json (unused)
- public/admin/development/metrics_cache.json (rename to metrics.json)
- data/development_history/*.json (historical snapshots - archive)
- public/data/development_history/*.json (duplicate historical)

## KEEP
- metrics.config.json (configuration, not data)
- public/admin/development/metrics.json (SINGLE SOURCE)

## ACTIONS
1. Rename metrics_cache.json → metrics.json
2. Delete all other metrics JSON files
3. Update script to write to metrics.json
4. Update all dashboards to load from metrics.json
