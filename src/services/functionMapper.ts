export interface FunctionMapping {
  category: string;
  matillionOrSql: string;
  pysparkEquivalent: string;
  exampleMatillion: string;
  examplePySpark: string;
  notes: string;
}

export const FUNCTION_MAPPINGS: FunctionMapping[] = [
  {
    category: 'Null Handling',
    matillionOrSql: 'NVL(col, default) / IFNULL(col, default)',
    pysparkEquivalent: 'F.coalesce(F.col("col"), F.lit(default))',
    exampleMatillion: 'NVL(customer_status, "PENDING")',
    examplePySpark: 'F.coalesce(F.col("customer_status"), F.lit("PENDING"))',
    notes: 'Handles null substitution in DataFrame columns'
  },
  {
    category: 'Null Handling',
    matillionOrSql: 'NULLIF(expr1, expr2)',
    pysparkEquivalent: 'F.when(F.col("expr1") == F.col("expr2"), None).otherwise(F.col("expr1"))',
    exampleMatillion: 'NULLIF(discount_rate, 0)',
    examplePySpark: 'F.when(F.col("discount_rate") == 0, None).otherwise(F.col("discount_rate"))',
    notes: 'Returns NULL if expressions are equal'
  },
  {
    category: 'Conditional',
    matillionOrSql: 'IFF(condition, true_val, false_val)',
    pysparkEquivalent: 'F.when(condition, true_val).otherwise(false_val)',
    exampleMatillion: 'IFF(amount > 1000, "VIP", "STANDARD")',
    examplePySpark: 'F.when(F.col("amount") > 1000, "VIP").otherwise("STANDARD")',
    notes: 'Snowflake/Matillion ternary conditional'
  },
  {
    category: 'Conditional',
    matillionOrSql: 'CASE WHEN cond1 THEN val1 ELSE def END',
    pysparkEquivalent: 'F.when(cond1, val1).otherwise(def)',
    exampleMatillion: 'CASE WHEN score >= 90 THEN "A" WHEN score >= 80 THEN "B" ELSE "C" END',
    examplePySpark: 'F.when(F.col("score") >= 90, "A").when(F.col("score") >= 80, "B").otherwise("C")',
    notes: 'Chained conditions use consecutive .when() clauses'
  },
  {
    category: 'String',
    matillionOrSql: 'CONCAT(str1, str2, ...)',
    pysparkEquivalent: 'F.concat(F.col("str1"), F.col("str2"))',
    exampleMatillion: 'CONCAT(first_name, " ", last_name)',
    examplePySpark: 'F.concat_ws(" ", F.col("first_name"), F.col("last_name"))',
    notes: 'Use concat_ws for delimiter-separated strings'
  },
  {
    category: 'String',
    matillionOrSql: 'SUBSTR / SUBSTRING(col, start, length)',
    pysparkEquivalent: 'F.substring(F.col("col"), start, length)',
    exampleMatillion: 'SUBSTR(postal_code, 1, 5)',
    examplePySpark: 'F.substring(F.col("postal_code"), 1, 5)',
    notes: '1-based indexing in PySpark substring'
  },
  {
    category: 'String',
    matillionOrSql: 'REGEXP_SUBSTR(col, pattern)',
    pysparkEquivalent: 'F.regexp_extract(F.col("col"), r"pattern", idx)',
    exampleMatillion: 'REGEXP_SUBSTR(email, "@([a-zA-Z0-9.-]+)", 1)',
    examplePySpark: 'F.regexp_extract(F.col("email"), r"@([a-zA-Z0-9.-]+)", 1)',
    notes: 'Extracts regex group into a new column'
  },
  {
    category: 'Dates & Time',
    matillionOrSql: 'CURRENT_TIMESTAMP() / GETDATE()',
    pysparkEquivalent: 'F.current_timestamp()',
    exampleMatillion: 'CURRENT_TIMESTAMP()',
    examplePySpark: 'F.current_timestamp()',
    notes: 'Returns current cluster UTC timestamp'
  },
  {
    category: 'Dates & Time',
    matillionOrSql: 'DATEADD(day, num, date_col)',
    pysparkEquivalent: 'F.date_add(F.col("date_col"), num)',
    exampleMatillion: 'DATEADD(day, 7, order_date)',
    examplePySpark: 'F.date_add(F.col("order_date"), 7)',
    notes: 'For months: F.add_months(col, num)'
  },
  {
    category: 'Dates & Time',
    matillionOrSql: 'DATEDIFF(day, start_date, end_date)',
    pysparkEquivalent: 'F.datediff(F.col("end_date"), F.col("start_date"))',
    exampleMatillion: 'DATEDIFF(day, created_at, shipped_at)',
    examplePySpark: 'F.datediff(F.col("shipped_at"), F.col("created_at"))',
    notes: 'Note argument order: PySpark takes end_date first'
  },
  {
    category: 'Dates & Time',
    matillionOrSql: 'TO_CHAR(date_col, "YYYY-MM-DD")',
    pysparkEquivalent: 'F.date_format(F.col("date_col"), "yyyy-MM-dd")',
    exampleMatillion: 'TO_CHAR(order_date, "YYYY-MM")',
    examplePySpark: 'F.date_format(F.col("order_date"), "yyyy-MM")',
    notes: 'Standard Java SimpleDateFormat pattern'
  },
  {
    category: 'Type Casting',
    matillionOrSql: 'CAST(col AS type) / col::type',
    pysparkEquivalent: 'F.col("col").cast(T.Type()) / F.col("col").cast("type")',
    exampleMatillion: 'CAST(user_id AS BIGINT)',
    examplePySpark: 'F.col("user_id").cast(T.LongType())',
    notes: 'Supports string aliases like "long", "double", "date", "string"'
  },
  {
    category: 'JSON / Semi-Structured',
    matillionOrSql: 'FLATTEN(json_array_col)',
    pysparkEquivalent: 'F.explode(F.from_json(col, schema))',
    exampleMatillion: 'FLATTEN(input => raw_json:items)',
    examplePySpark: 'F.explode(F.from_json(F.col("raw_json"), items_schema))',
    notes: 'Expands array items into individual rows'
  },
  {
    category: 'Window Functions',
    matillionOrSql: 'ROW_NUMBER() OVER (PARTITION BY k ORDER BY v DESC)',
    pysparkEquivalent: 'F.row_number().over(Window.partitionBy("k").orderBy(F.col("v").desc()))',
    exampleMatillion: 'ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC)',
    examplePySpark: 'w = Window.partitionBy("customer_id").orderBy(F.col("order_date").desc())\nF.row_number().over(w)',
    notes: 'Imports from pyspark.sql.window import Window'
  },
  {
    category: 'Delta Merges',
    matillionOrSql: 'Matillion Table Output (Update / Insert Key Match)',
    pysparkEquivalent: 'DeltaTable.forName(spark, table).alias("tgt").merge(df.alias("src"), key_expr).whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()',
    exampleMatillion: 'Key: [id], Match: Update, No Match: Insert',
    examplePySpark: 'delta_table.merge(source_df, "tgt.id = src.id").whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()',
    notes: 'Databricks Delta Lake ACID MERGE INTO execution'
  }
];

export function translateMatillionExprToPySpark(expr: string): string {
  if (!expr) return '';
  let res = expr.trim();

  // Replace variable substitutions: ${var_name} or [var_name] -> dbutils.widgets.get("var_name") or python var
  res = res.replace(/\$\{(\w+)\}/g, 'dbutils.widgets.get("$1")');
  
  // Replace NVL(a, b) -> F.coalesce(a, b)
  res = res.replace(/\bNVL\s*\(/gi, 'F.coalesce(');
  res = res.replace(/\bIFNULL\s*\(/gi, 'F.coalesce(');
  
  // Replace CURRENT_TIMESTAMP() -> F.current_timestamp()
  res = res.replace(/\bCURRENT_TIMESTAMP\(\)/gi, 'F.current_timestamp()');
  res = res.replace(/\bCURRENT_DATE\(\)/gi, 'F.current_date()');
  res = res.replace(/\bGETDATE\(\)/gi, 'F.current_timestamp()');
  
  return res;
}
