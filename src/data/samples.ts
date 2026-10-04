import { MatillionJob } from '../types/matillion';

export const SAMPLE_JOBS: MatillionJob[] = [
  {
    id: 'sample-cust-360',
    name: 'Transform_Customer_360_Enrichment',
    jobType: 'Transformation',
    description: 'Enriches raw customer transactions, calculates loyalty tiers, aggregations, window ranks, and merges into Delta Lake gold dimension.',
    targetPlatform: 'Snowflake',
    variables: [
      { name: 'start_date', datatype: 'DateTime', defaultValue: '2024-01-01', description: 'Filter start date for processing window' },
      { name: 'target_tier_threshold', datatype: 'Numeric', defaultValue: '5000', description: 'Annual spend minimum for VIP status' },
      { name: 'env', datatype: 'Text', defaultValue: 'prod', description: 'Target environment prefix' }
    ],
    components: [
      {
        id: 'comp-1',
        name: 'stg_customers',
        type: 'Table Input',
        category: 'Read',
        x: 100,
        y: 120,
        parameters: {
          database: 'RAW_DATABASE',
          schema: 'CRM',
          targetTable: 'customers',
          columns: ['customer_id', 'first_name', 'last_name', 'email', 'signup_date', 'country', 'status']
        }
      },
      {
        id: 'comp-2',
        name: 'stg_orders',
        type: 'Table Input',
        category: 'Read',
        x: 100,
        y: 280,
        parameters: {
          database: 'RAW_DATABASE',
          schema: 'ECOMMERCE',
          targetTable: 'orders',
          columns: ['order_id', 'customer_id', 'order_date', 'order_status', 'shipping_amount', 'tax_amount']
        }
      },
      {
        id: 'comp-3',
        name: 'stg_order_items',
        type: 'Table Input',
        category: 'Read',
        x: 100,
        y: 440,
        parameters: {
          database: 'RAW_DATABASE',
          schema: 'ECOMMERCE',
          targetTable: 'order_items',
          columns: ['item_id', 'order_id', 'product_id', 'quantity', 'unit_price', 'discount_pct']
        }
      },
      {
        id: 'comp-4',
        name: 'calc_line_item_subtotal',
        type: 'Calculator',
        category: 'Transform',
        x: 340,
        y: 440,
        parameters: {
          calculations: [
            { targetColumn: 'net_item_price', expression: 'quantity * unit_price * (1 - COALESCE(discount_pct, 0) / 100.0)' },
            { targetColumn: 'is_discounted', expression: 'CASE WHEN discount_pct > 0 THEN 1 ELSE 0 END' }
          ]
        }
      },
      {
        id: 'comp-5',
        name: 'filter_active_orders',
        type: 'Filter',
        category: 'Filter',
        x: 340,
        y: 280,
        parameters: {
          filterExpression: "order_status != 'CANCELLED' AND order_date >= '${start_date}'"
        }
      },
      {
        id: 'comp-6',
        name: 'join_orders_with_items',
        type: 'Join',
        category: 'Join',
        x: 560,
        y: 360,
        parameters: {
          joinType: 'INNER',
          leftTable: 'filter_active_orders',
          rightTable: 'calc_line_item_subtotal',
          joinConditions: ['filter_active_orders.order_id = calc_line_item_subtotal.order_id']
        }
      },
      {
        id: 'comp-7',
        name: 'agg_customer_totals',
        type: 'Aggregate',
        category: 'Aggregate',
        x: 780,
        y: 360,
        parameters: {
          groupBy: ['customer_id'],
          aggregations: [
            { column: 'net_item_price', function: 'SUM', alias: 'lifetime_spend' },
            { column: 'order_id', function: 'COUNT_DISTINCT', alias: 'total_orders_count' },
            { column: 'order_date', function: 'MAX', alias: 'last_order_date' },
            { column: 'order_date', function: 'MIN', alias: 'first_order_date' }
          ]
        }
      },
      {
        id: 'comp-8',
        name: 'join_customer_profile',
        type: 'Join',
        category: 'Join',
        x: 980,
        y: 220,
        parameters: {
          joinType: 'LEFT',
          leftTable: 'stg_customers',
          rightTable: 'agg_customer_totals',
          joinConditions: ['stg_customers.customer_id = agg_customer_totals.customer_id']
        }
      },
      {
        id: 'comp-9',
        name: 'calc_loyalty_segment',
        type: 'Calculator',
        category: 'Transform',
        x: 1200,
        y: 220,
        parameters: {
          calculations: [
            { targetColumn: 'full_name', expression: "CONCAT(first_name, ' ', last_name)" },
            { targetColumn: 'effective_spend', expression: 'COALESCE(lifetime_spend, 0.0)' },
            { 
              targetColumn: 'loyalty_tier', 
              expression: "CASE WHEN COALESCE(lifetime_spend, 0) >= ${target_tier_threshold} THEN 'PLATINUM' WHEN COALESCE(lifetime_spend, 0) >= 2000 THEN 'GOLD' WHEN COALESCE(lifetime_spend, 0) >= 500 THEN 'SILVER' ELSE 'BRONZE' END" 
            },
            { targetColumn: 'etl_updated_at', expression: 'CURRENT_TIMESTAMP()' }
          ]
        }
      },
      {
        id: 'comp-10',
        name: 'rank_regional_customers',
        type: 'Rank / Window',
        category: 'Transform',
        x: 1420,
        y: 220,
        parameters: {
          partitionBy: ['country'],
          orderBy: [{ column: 'effective_spend', direction: 'DESC' }],
          function: 'DENSE_RANK',
          targetColumn: 'country_rank'
        }
      },
      {
        id: 'comp-11',
        name: 'upsert_gold_customer_360',
        type: 'Table Output',
        category: 'Write',
        x: 1640,
        y: 220,
        parameters: {
          database: 'GOLD_CATALOG',
          schema: 'ANALYTICS',
          targetTable: 'dim_customer_360',
          writeMode: 'MERGE',
          matchKeys: ['customer_id'],
          liquidClusteringColumns: ['country', 'loyalty_tier'],
          onMatch: 'UPDATE',
          onNoMatch: 'INSERT'
        }
      }
    ],
    links: [
      { id: 'l1', fromId: 'comp-3', toId: 'comp-4' },
      { id: 'l2', fromId: 'comp-2', toId: 'comp-5' },
      { id: 'l3', fromId: 'comp-5', toId: 'comp-6' },
      { id: 'l4', fromId: 'comp-4', toId: 'comp-6' },
      { id: 'l5', fromId: 'comp-6', toId: 'comp-7' },
      { id: 'l6', fromId: 'comp-1', toId: 'comp-8' },
      { id: 'l7', fromId: 'comp-7', toId: 'comp-8' },
      { id: 'l8', fromId: 'comp-8', toId: 'comp-9' },
      { id: 'l9', fromId: 'comp-9', toId: 'comp-10' },
      { id: 'l10', fromId: 'comp-10', toId: 'comp-11' }
    ]
  },
  {
    id: 'sample-daily-fact',
    name: 'Orchestration_Daily_Sales_Ingestion',
    jobType: 'Orchestration',
    description: 'Production orchestrator pipeline: validates S3 delivery, stages CSV files, invokes transformation notebook, optimizes Delta Lake table, and triggers status notifications.',
    targetPlatform: 'Redshift',
    variables: [
      { name: 'batch_date', datatype: 'DateTime', defaultValue: '2024-05-18', description: 'Execution batch date parameter' },
      { name: 's3_bucket', datatype: 'Text', defaultValue: 'acme-corp-datalake-landing', description: 'Incoming cloud storage bucket' },
      { name: 'slack_webhook', datatype: 'Text', defaultValue: 'https://hooks.slack.com/services/T00/B00/X00', description: 'Alert webhook endpoint' }
    ],
    components: [
      {
        id: 'orch-1',
        name: 'Start_Pipeline',
        type: 'Start',
        category: 'Control',
        x: 80,
        y: 180,
        parameters: {}
      },
      {
        id: 'orch-2',
        name: 'Check_S3_File_Arrival',
        type: 'File Exists',
        category: 'Read',
        x: 280,
        y: 180,
        parameters: {
          storageType: 'S3 / ADLS',
          uri: 's3://${s3_bucket}/sales/${batch_date}/',
          pattern: '*.csv.gz',
          failIfMissing: true
        }
      },
      {
        id: 'orch-3',
        name: 'Truncate_Staging_Table',
        type: 'SQL Script',
        category: 'Script',
        x: 480,
        y: 180,
        parameters: {
          sql: 'TRUNCATE TABLE staging.stg_daily_sales;'
        }
      },
      {
        id: 'orch-4',
        name: 'Load_S3_To_Staging',
        type: 'S3 Load',
        category: 'Read',
        x: 680,
        y: 180,
        parameters: {
          sourceUri: 's3://${s3_bucket}/sales/${batch_date}/',
          format: 'CSV',
          targetTable: 'staging.stg_daily_sales',
          delimiter: ',',
          hasHeader: true,
          compression: 'GZIP'
        }
      },
      {
        id: 'orch-5',
        name: 'Run_Sales_Transformation',
        type: 'Run Transformation',
        category: 'Orchestration',
        x: 880,
        y: 180,
        parameters: {
          jobName: 'Transform_Daily_Sales_Fact',
          passVariables: ['batch_date']
        }
      },
      {
        id: 'orch-6',
        name: 'Delta_Optimize_ZOrder',
        type: 'SQL Script',
        category: 'Script',
        x: 1080,
        y: 180,
        parameters: {
          sql: 'OPTIMIZE analytics.fact_daily_sales ZORDER BY (store_id, customer_id);'
        }
      },
      {
        id: 'orch-7',
        name: 'Notify_Slack_Success',
        type: 'Webhook Notification',
        category: 'Control',
        x: 1280,
        y: 120,
        parameters: {
          channel: '#data-ops-notifications',
          message: 'SUCCESS: Daily Sales Fact ingestion completed for ${batch_date}'
        }
      },
      {
        id: 'orch-8',
        name: 'Notify_Slack_Failure',
        type: 'Webhook Notification',
        category: 'Control',
        x: 880,
        y: 340,
        parameters: {
          channel: '#data-ops-alerts',
          message: 'FAILED: Daily Sales Fact ingestion pipeline halted at batch ${batch_date}'
        }
      }
    ],
    links: [
      { id: 'ol1', fromId: 'orch-1', toId: 'orch-2', condition: 'UNCONDITIONAL' },
      { id: 'ol2', fromId: 'orch-2', toId: 'orch-3', condition: 'SUCCESS' },
      { id: 'ol3', fromId: 'orch-3', toId: 'orch-4', condition: 'SUCCESS' },
      { id: 'ol4', fromId: 'orch-4', toId: 'orch-5', condition: 'SUCCESS' },
      { id: 'ol5', fromId: 'orch-5', toId: 'orch-6', condition: 'SUCCESS' },
      { id: 'ol6', fromId: 'orch-6', toId: 'orch-7', condition: 'SUCCESS' },
      { id: 'ol7', fromId: 'orch-2', toId: 'orch-8', condition: 'FAILURE' },
      { id: 'ol8', fromId: 'orch-5', toId: 'orch-8', condition: 'FAILURE' }
    ]
  },
  {
    id: 'sample-scd2-dim',
    name: 'Transform_Financial_Account_SCD2',
    jobType: 'Transformation',
    description: 'Implements Slowly Changing Dimension Type 2 (SCD2) tracking historical changes in credit limits, status, and balances with Delta Lake MERGE.',
    targetPlatform: 'Snowflake',
    variables: [
      { name: 'as_of_date', datatype: 'DateTime', defaultValue: '2024-06-01', description: 'Effective snapshot date' }
    ],
    components: [
      {
        id: 'scd-1',
        name: 'stg_raw_accounts',
        type: 'Table Input',
        category: 'Read',
        x: 100,
        y: 120,
        parameters: {
          database: 'CORE_BANKING',
          schema: 'PUBLIC',
          targetTable: 'raw_accounts',
          columns: ['account_id', 'customer_id', 'account_type', 'credit_limit', 'balance', 'account_status']
        }
      },
      {
        id: 'scd-2',
        name: 'dim_current_accounts',
        type: 'Table Input',
        category: 'Read',
        x: 100,
        y: 280,
        parameters: {
          database: 'GOLD_FINANCE',
          schema: 'EDW',
          targetTable: 'dim_account_scd2',
          columns: ['account_sk', 'account_id', 'credit_limit', 'balance', 'account_status', 'is_current', 'valid_from', 'valid_to'],
          sqlWhere: 'is_current = true'
        }
      },
      {
        id: 'scd-3',
        name: 'calc_source_hash',
        type: 'Calculator',
        category: 'Transform',
        x: 320,
        y: 120,
        parameters: {
          calculations: [
            { 
              targetColumn: 'source_hash_diff', 
              expression: "MD5(CONCAT_WS('~', account_type, CAST(credit_limit AS VARCHAR), CAST(balance AS VARCHAR), account_status))" 
            }
          ]
        }
      },
      {
        id: 'scd-4',
        name: 'calc_target_hash',
        type: 'Calculator',
        category: 'Transform',
        x: 320,
        y: 280,
        parameters: {
          calculations: [
            { 
              targetColumn: 'target_hash_diff', 
              expression: "MD5(CONCAT_WS('~', account_type, CAST(credit_limit AS VARCHAR), CAST(balance AS VARCHAR), account_status))" 
            }
          ]
        }
      },
      {
        id: 'scd-5',
        name: 'join_source_with_current',
        type: 'Join',
        category: 'Join',
        x: 540,
        y: 200,
        parameters: {
          joinType: 'FULL',
          leftTable: 'calc_source_hash',
          rightTable: 'calc_target_hash',
          joinConditions: ['calc_source_hash.account_id = calc_target_hash.account_id']
        }
      },
      {
        id: 'scd-6',
        name: 'filter_changes_and_inserts',
        type: 'Filter',
        category: 'Filter',
        x: 760,
        y: 200,
        parameters: {
          filterExpression: 'target_hash_diff IS NULL OR source_hash_diff != target_hash_diff'
        }
      },
      {
        id: 'scd-7',
        name: 'calc_scd2_metadata',
        type: 'Calculator',
        category: 'Transform',
        x: 980,
        y: 200,
        parameters: {
          calculations: [
            { targetColumn: 'valid_from', expression: "CAST('${as_of_date}' AS DATE)" },
            { targetColumn: 'valid_to', expression: "CAST('9999-12-31' AS DATE)" },
            { targetColumn: 'is_current', expression: 'TRUE' },
            { targetColumn: 'action_type', expression: "CASE WHEN target_hash_diff IS NULL THEN 'INSERT' ELSE 'UPDATE' END" }
          ]
        }
      },
      {
        id: 'scd-8',
        name: 'scd2_delta_merge',
        type: 'Table Output',
        category: 'Write',
        x: 1200,
        y: 200,
        parameters: {
          database: 'GOLD_FINANCE',
          schema: 'EDW',
          targetTable: 'dim_account_scd2',
          writeMode: 'SCD2_MERGE',
          matchKeys: ['account_id'],
          validFromCol: 'valid_from',
          validToCol: 'valid_to',
          isCurrentCol: 'is_current'
        }
      }
    ],
    links: [
      { id: 'sl1', fromId: 'scd-1', toId: 'scd-3' },
      { id: 'sl2', fromId: 'scd-2', toId: 'scd-4' },
      { id: 'sl3', fromId: 'scd-3', toId: 'scd-5' },
      { id: 'sl4', fromId: 'scd-4', toId: 'scd-5' },
      { id: 'sl5', fromId: 'scd-5', toId: 'scd-6' },
      { id: 'sl6', fromId: 'scd-6', toId: 'scd-7' },
      { id: 'sl7', fromId: 'scd-7', toId: 'scd-8' }
    ]
  },
  {
    id: 'sample-json-clickstream',
    name: 'Transform_Clickstream_JSON_Explode',
    jobType: 'Transformation',
    description: 'Parses nested JSON telemetry payloads, explodes event arrays, flattens metadata, removes duplicates, and saves with Databricks Liquid Clustering.',
    targetPlatform: 'Generic',
    variables: [
      { name: 'max_batch_size', datatype: 'Numeric', defaultValue: '100000', description: 'Batch processing threshold' }
    ],
    components: [
      {
        id: 'json-1',
        name: 'raw_bronze_stream',
        type: 'Table Input',
        category: 'Read',
        x: 100,
        y: 200,
        parameters: {
          database: 'BRONZE_LAKE',
          schema: 'STREAMING',
          targetTable: 'raw_user_events',
          columns: ['ingest_timestamp', 'session_id', 'ip_address', 'raw_payload_json']
        }
      },
      {
        id: 'json-2',
        name: 'flatten_event_array',
        type: 'Flatten',
        category: 'Transform',
        x: 340,
        y: 200,
        parameters: {
          inputColumn: 'raw_payload_json',
          jsonPath: '$.events[*]',
          outputAlias: 'event_record'
        }
      },
      {
        id: 'json-3',
        name: 'calc_event_columns',
        type: 'Calculator',
        category: 'Transform',
        x: 580,
        y: 200,
        parameters: {
          calculations: [
            { targetColumn: 'event_name', expression: "JSON_EXTRACT_PATH_TEXT(event_record, 'name')" },
            { targetColumn: 'event_time', expression: "TO_TIMESTAMP(JSON_EXTRACT_PATH_TEXT(event_record, 'timestamp'))" },
            { targetColumn: 'page_url', expression: "JSON_EXTRACT_PATH_TEXT(event_record, 'properties.url')" },
            { targetColumn: 'event_date', expression: "TO_DATE(TO_TIMESTAMP(JSON_EXTRACT_PATH_TEXT(event_record, 'timestamp')))" }
          ]
        }
      },
      {
        id: 'json-4',
        name: 'filter_valid_events',
        type: 'Filter',
        category: 'Filter',
        x: 800,
        y: 200,
        parameters: {
          filterExpression: "event_name IS NOT NULL AND event_name != 'heartbeat'"
        }
      },
      {
        id: 'json-5',
        name: 'dedup_session_events',
        type: 'Deduplicate',
        category: 'Transform',
        x: 1020,
        y: 200,
        parameters: {
          dedupColumns: ['session_id', 'event_name', 'event_time']
        }
      },
      {
        id: 'json-6',
        name: 'write_silver_events',
        type: 'Table Output',
        category: 'Write',
        x: 1240,
        y: 200,
        parameters: {
          database: 'SILVER_LAKE',
          schema: 'WEB_ANALYTICS',
          targetTable: 'silver_user_events',
          writeMode: 'APPEND',
          liquidClusteringColumns: ['event_date', 'event_name']
        }
      }
    ],
    links: [
      { id: 'jl1', fromId: 'json-1', toId: 'json-2' },
      { id: 'jl2', fromId: 'json-2', toId: 'json-3' },
      { id: 'jl3', fromId: 'json-3', toId: 'json-4' },
      { id: 'jl4', fromId: 'json-4', toId: 'json-5' },
      { id: 'jl5', fromId: 'json-5', toId: 'json-6' }
    ]
  },
  {
    id: 'sample-table-iterator',
    name: 'Orchestration_Multi_Tenant_Iterator',
    jobType: 'Orchestration',
    description: 'Dynamic table iterator orchestration: queries tenant catalog, iterates across client databases in parallel, and executes parameterized transformation notebooks.',
    targetPlatform: 'Snowflake',
    variables: [
      { name: 'tenant_filter_status', datatype: 'Text', defaultValue: 'ACTIVE', description: 'Filter tenants by status' },
      { name: 'current_tenant_id', datatype: 'Text', defaultValue: '', description: 'Iteration iterator variable' }
    ],
    components: [
      {
        id: 'iter-1',
        name: 'Start_Orchestration',
        type: 'Start',
        category: 'Control',
        x: 80,
        y: 180,
        parameters: {}
      },
      {
        id: 'iter-2',
        name: 'Fetch_Active_Tenants',
        type: 'Table Input',
        category: 'Read',
        x: 280,
        y: 180,
        parameters: {
          database: 'METADATA_DB',
          schema: 'CONFIG',
          targetTable: 'registered_tenants',
          sqlWhere: "status = '${tenant_filter_status}'"
        }
      },
      {
        id: 'iter-3',
        name: 'Tenant_Loop_Iterator',
        type: 'Table Iterator',
        category: 'Orchestration',
        x: 500,
        y: 180,
        parameters: {
          loopVariable: 'current_tenant_id',
          sourceColumn: 'tenant_id',
          concurrency: 4
        }
      },
      {
        id: 'iter-4',
        name: 'Run_Tenant_ETL_Notebook',
        type: 'Run Transformation',
        category: 'Orchestration',
        x: 720,
        y: 180,
        parameters: {
          jobName: 'Process_Tenant_Ledger',
          passVariables: ['current_tenant_id']
        }
      },
      {
        id: 'iter-5',
        name: 'Vacuum_Delta_Tables',
        type: 'SQL Script',
        category: 'Script',
        x: 940,
        y: 180,
        parameters: {
          sql: 'VACUUM analytics.consolidated_tenant_ledger RETAIN 168 HOURS;'
        }
      },
      {
        id: 'iter-6',
        name: 'Completion_Notice',
        type: 'Webhook Notification',
        category: 'Control',
        x: 1160,
        y: 180,
        parameters: {
          channel: '#tenant-sync-ops',
          message: 'All tenant iterations finished successfully.'
        }
      }
    ],
    links: [
      { id: 'it1', fromId: 'iter-1', toId: 'iter-2', condition: 'UNCONDITIONAL' },
      { id: 'it2', fromId: 'iter-2', toId: 'iter-3', condition: 'SUCCESS' },
      { id: 'it3', fromId: 'iter-3', toId: 'iter-4', condition: 'SUCCESS' },
      { id: 'it4', fromId: 'iter-4', toId: 'iter-5', condition: 'SUCCESS' },
      { id: 'it5', fromId: 'iter-5', toId: 'iter-6', condition: 'SUCCESS' }
    ]
  }
];
