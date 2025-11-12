# Datafeed Ingestion Command

This document describes the `ingest:datafeed-from-s3` command that processes datafeed CSV files from S3 buckets for bulk data operations.

## Overview

The command processes three types of CSV files from S3:

1. **product_patch.csv** - Updates existing products in the database
2. **seller_to_insert.csv** - Inserts new sellers into the database
3. **product_insert.csv** - Inserts new products into the database

**Note**: S3 paths are configurable at the top of the command file (`src/commands/ingest_csv_from_s3.ts`) in the `S3_PATHS` constant for easy maintenance.

## Prerequisites

### Environment Variables

The command supports multiple AWS authentication methods:

**Option 1: Environment Variables (Explicit Credentials)**
```bash
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

**Option 2: IAM Role/Instance Metadata (Automatic)**
If the above environment variables are not set, the command will automatically use:
- IAM roles (for EC2 instances)
- AWS profiles from `~/.aws/credentials`
- Instance metadata service
- Other default AWS credential providers

### S3 Bucket Structure

The command expects files to be organized in the following S3 structure:

```
s3://involve-data/
├── seller_cashback/product_patch.csv/
│   ├── file1.csv
│   ├── file2.csv
│   └── ...
├── seller_cashback/seller_to_insert.csv/
│   ├── file1.csv
│   ├── file2.csv
│   └── ...
└── seller_cashback/product_insert.csv/
    ├── file1.csv
    ├── file2.csv
    └── ...
```

## Usage

### Basic Usage

```bash
node ace ingest:datafeed-from-s3
```

### Command Options

- `--region` - AWS region for S3 bucket (default: ap-southeast-1)
- `--bucket` - S3 bucket name (default: involve-data)
- `--batch-size` - Batch size for database operations (default: 1000)
- `--dry-run` - Process files but don't write to database (default: false)
- `--sequence` - Execution sequence (comma-separated): PRODUCT_PATCH,SELLER_INSERT,PRODUCT_INSERT (default: all three in order)

### Examples

```bash
# Basic usage with default settings (processes all three types in order)
node ace ingest:datafeed-from-s3

# Specify different region and bucket
node ace ingest:datafeed-from-s3 --region=us-east-1 --bucket=my-bucket

# Use smaller batch size for memory optimization
node ace ingest:datafeed-from-s3 --batch-size=500

# Dry run to test without writing to database
node ace ingest:datafeed-from-s3 --dry-run

# Execute only specific steps
node ace ingest:datafeed-from-s3 --sequence=PRODUCT_PATCH

# Execute in custom order
node ace ingest:datafeed-from-s3 --sequence=SELLER_INSERT,PRODUCT_INSERT

# Execute multiple steps in specific order
node ace ingest:datafeed-from-s3 --sequence=PRODUCT_PATCH,SELLER_INSERT,PRODUCT_INSERT
```

## CSV File Formats

### 1. product_patch.csv

Updates existing products in the `products` table.

**Required Columns:**
- `id` - Product ID (required for identifying the record to update)
- `active` - Boolean value (true/false, 1/0) - optional, skipped if null
- `seller_commission_rate` - Float value - optional, skipped if null
- `updated_at` - Timestamp - optional

**Example:**
```csv
id,active,seller_commission_rate,updated_at
123,true,0.05,2024-01-15 10:30:00
124,false,,2024-01-15 10:31:00
125,,0.08,2024-01-15 10:32:00
```

### 2. seller_to_insert.csv

Inserts new sellers into the `sellers` table.

**Required Columns:**
- `platform_seller_id` - Unique seller ID from platform
- `name` - Seller name
- `active_product_count` - Number of active products
- `commission_rate` - Commission rate (0.0 to 1.0)
- `rating` - Seller rating
- `image_url` - Seller image URL
- `platform_id` - Platform ID (default: 1)
- `last_synced_at` - Last sync timestamp (optional)

**Example:**
```csv
platform_seller_id,name,active_product_count,commission_rate,rating,image_url,platform_id,last_synced_at
12345,Seller Name,100,0.05,4.5,https://example.com/image.jpg,1,2024-01-15 10:30:00
```

### 3. product_insert.csv

Inserts new products into the `products` table.

**Required Columns:**
- `platform_item_id` - Unique product ID from platform
- `name` - Product name
- `currency` - Currency code (default: RM)
- `price_min` - Minimum price
- `price_max` - Maximum price
- `discount_rate` - Discount rate (0.0 to 1.0)
- `category_id` - Category ID
- `category_tree` - Category hierarchy
- `url` - Product URL
- `image_url` - Product image URL
- `rating` - Product rating
- `platform_commission_rate` - Platform commission rate
- `seller_commission_rate` - Seller commission rate
- `sales` - Sales count
- `clicks` - Click count
- `active` - Active status (true/false)

**Seller Reference (Required - one of the following):**
- `seller_id` - Direct seller ID (foreign key to sellers.id), OR
- `platform_seller_id` - Platform seller ID (will be looked up in sellers table)

**Note**: The `seller_id` column is a foreign key that references the primary key (`id`) in the `sellers` table. If `seller_id` is provided directly, it will be used. If `platform_seller_id` is provided instead, the command will look up the corresponding `seller_id` from the sellers table.

**Example:**
```csv
platform_item_id,name,currency,price_min,price_max,discount_rate,category_id,category_tree,url,image_url,rating,platform_commission_rate,seller_commission_rate,sales,clicks,active,seller_id
ABC123,Product Name,RM,10.00,15.00,0.1,1,Electronics > Phones,https://example.com/product,https://example.com/image.jpg,4.2,0.03,0.05,100,50,true,1
```

## Features

### Execution Sequence Control

The command supports flexible execution sequences using the `--sequence` parameter:

- **Default**: `PRODUCT_PATCH,SELLER_INSERT,PRODUCT_INSERT` (processes all three in order)
- **Single Step**: `--sequence=PRODUCT_PATCH` (only processes product patches)
- **Custom Order**: `--sequence=SELLER_INSERT,PRODUCT_INSERT` (skips product patches)
- **Partial Execution**: `--sequence=SELLER_INSERT` (only processes seller inserts)

**Valid sequence steps:**
- `PRODUCT_PATCH` - Updates existing products
- `SELLER_INSERT` - Inserts/updates sellers
- `PRODUCT_INSERT` - Inserts/updates products

**Important**: When using `PRODUCT_INSERT`, ensure that sellers are already in the database (either run `SELLER_INSERT` first or ensure sellers exist from previous runs).

### Progress Tracking

The command displays progress for each file being processed:

```
Processing mahadir/seller_cashback/deactivate_product.csv/file1.csv: 1500/5000 (30%)
```

### Advanced CSV Parsing

The command includes a robust CSV parser that handles:
- **Quoted fields with commas**: `"Product, with comma"`
- **Escaped quotes**: `"Product with ""quotes"""` becomes `Product with "quotes"`
- **Whitespace preservation**: Quoted fields preserve internal whitespace
- **Mixed quoting**: Combination of quoted and unquoted fields in the same row

This matches PySpark's CSV parsing behavior with:
```python
.option("quote", '"')
.option("escape", '"')
.option("header", True)
```

### Batch Processing

- Processes records in configurable batches (default: 1000 records)
- Uses database transactions for data integrity
- Handles memory efficiently for large files

### DateTime Handling

The command includes robust datetime parsing that:
- **Supports multiple formats**: ISO, SQL, and common date formats
- **Handles invalid dates**: Invalid datetime values are set to `null` instead of causing errors
- **MySQL compatibility**: Outputs datetime in MySQL-compatible format (`yyyy-MM-dd HH:mm:ss`)
- **Graceful fallback**: Logs warnings for unparseable dates and continues processing

### Error Handling

- Comprehensive error logging
- Transaction rollback on failures
- Sentry integration for error tracking
- Graceful handling of missing files or invalid data

### Duplicate Handling

- Uses `INSERT IGNORE` for MySQL
- Skips duplicate records without updating existing data
- Maintains data integrity by avoiding conflicts

### Null Value Handling

For `deactivate_product.csv`, null values are skipped:
- If `active` is null, the active column is not updated
- If `seller_commission_rate` is null, the commission rate is not updated

## Performance Considerations

- **Batch Size**: Adjust `--batch-size` based on available memory and database performance
- **File Size**: Each CSV file should contain approximately 5000 records for optimal processing
- **Concurrent Processing**: The command processes files sequentially to avoid database conflicts

## Monitoring

The command provides detailed logging:

- File discovery and processing status
- Progress indicators for each file
- Success/failure counts
- Error details with Sentry integration

## Troubleshooting

### Common Issues

1. **AWS Credentials**: Ensure AWS credentials are properly configured
2. **S3 Permissions**: Verify read access to the S3 bucket
3. **Database Connections**: Check database connectivity and permissions
4. **Memory Issues**: Reduce batch size if encountering memory problems

### Error Messages

- `Failed to initialize S3 client`: Check AWS credentials and region
- `Failed to list S3 files`: Verify bucket name and permissions
- `Seller not found for platform_seller_id`: Ensure sellers exist before inserting products
- `No valid products to insert`: Check CSV format and required fields

## Security

- AWS credentials should be stored securely as environment variables
- Database transactions ensure data integrity
- Input validation prevents SQL injection
- Error handling prevents sensitive data exposure
